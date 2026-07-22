import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import {
  access,
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises'
import net from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from 'playwright'

import { verifyNextConsumer } from './specs/next-app-router.mjs'
import { verifyViteConsumer } from './specs/vite-react.mjs'

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url))
const fixturesRoot = path.join(repositoryRoot, 'tests/consumers/fixtures')
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

function readOption(name) {
  const optionIndex = process.argv.indexOf(name)
  if (optionIndex === -1) return undefined

  const value = process.argv[optionIndex + 1]
  if (!value || value.startsWith('--')) {
    throw new Error(`${name} 옵션에는 값이 필요합니다.`)
  }
  return value
}

const mode = readOption('--mode')
const requestedTag = readOption('--tag')

if (mode !== 'local-package' && mode !== 'registry') {
  throw new Error(
    'Usage: node tests/consumers/run-consumers.mjs --mode <local-package|registry> [--tag <next|latest>]',
  )
}

if (mode === 'local-package' && requestedTag !== undefined) {
  throw new Error('--tag 옵션은 registry 모드에서만 사용할 수 있습니다.')
}

const registryTag = requestedTag ?? 'next'
if (mode === 'registry' && registryTag !== 'next' && registryTag !== 'latest') {
  throw new Error(
    `지원하지 않는 registry tag입니다: ${registryTag}. next 또는 latest를 사용하세요.`,
  )
}

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, CI: 'true' },
      stdio: 'inherit',
    })

    child.on('error', reject)
    child.on('exit', (code, signal) => {
      if (code === 0) resolve()
      else {
        reject(
          new Error(
            `${command} ${args.join(' ')} failed with ${signal ? `signal ${signal}` : `exit code ${String(code)}`}`,
          ),
        )
      }
    })
  })
}

function readCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, CI: 'true' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const stdout = []
    const stderr = []
    child.stdout.on('data', (chunk) => stdout.push(chunk.toString()))
    child.stderr.on('data', (chunk) => stderr.push(chunk.toString()))
    child.on('error', reject)
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve(stdout.join('').trim())
        return
      }

      reject(
        new Error(
          `${command} ${args.join(' ')} failed with ${
            signal ? `signal ${signal}` : `exit code ${String(code)}`
          }${stderr.length > 0 ? `\n${stderr.join('').trim()}` : ''}`,
        ),
      )
    })
  })
}

async function readRegistryVersion(packageName, tag) {
  const packageSpecifier = `@lyrd/${packageName}@${tag}`
  let output
  try {
    output = await readCommand(
      npmCommand,
      ['view', packageSpecifier, 'version', '--json'],
      repositoryRoot,
    )
  } catch (error) {
    throw new Error(`npm registry에서 ${packageSpecifier} 기대 버전을 조회하지 못했습니다.`, {
      cause: error,
    })
  }

  let version
  try {
    version = JSON.parse(output)
  } catch (error) {
    throw new Error(`npm registry의 ${packageSpecifier} 버전 응답이 올바른 JSON이 아닙니다.`, {
      cause: error,
    })
  }

  if (typeof version !== 'string' || version.length === 0) {
    throw new Error(`npm registry의 ${packageSpecifier} 버전 응답이 문자열이 아닙니다: ${output}`)
  }
  return version
}

async function readExpectedRegistryVersions(tag) {
  const [core, cli] = await Promise.all([
    readRegistryVersion('core', tag),
    readRegistryVersion('cli', tag),
  ])
  console.log(
    `[consumer:registry] expected ${tag} versions: @lyrd/core@${core} and @lyrd/cli@${cli}`,
  )
  return { core, cli }
}

async function createTarballs(temporaryRoot) {
  await runCommand(pnpmCommand, ['--filter', '@lyrd/core', 'build'], repositoryRoot)
  await runCommand(pnpmCommand, ['--filter', '@lyrd/cli', 'build'], repositoryRoot)

  const packRoot = path.join(temporaryRoot, 'packages')
  const corePackDirectory = path.join(packRoot, 'core')
  const cliPackDirectory = path.join(packRoot, 'cli')
  await mkdir(corePackDirectory, { recursive: true })
  await mkdir(cliPackDirectory, { recursive: true })

  await runCommand(
    pnpmCommand,
    ['pack', '--pack-destination', corePackDirectory],
    path.join(repositoryRoot, 'packages/core'),
  )
  await runCommand(
    pnpmCommand,
    ['pack', '--pack-destination', cliPackDirectory],
    path.join(repositoryRoot, 'packages/cli'),
  )

  return {
    core: await findTarball(corePackDirectory),
    cli: await findTarball(cliPackDirectory),
  }
}

async function findTarball(directory) {
  const tarballs = (await readdir(directory)).filter((fileName) => fileName.endsWith('.tgz'))
  assert.equal(tarballs.length, 1, `${directory}에 tarball이 정확히 하나 있어야 합니다.`)
  return path.join(directory, tarballs[0])
}

async function copyFixture(name, temporaryRoot, packageSpecs) {
  const fixtureDirectory = path.join(temporaryRoot, name)
  await cp(path.join(fixturesRoot, name), fixtureDirectory, { recursive: true })
  await rm(path.join(fixtureDirectory, 'node_modules'), { recursive: true, force: true })
  await rm(path.join(fixtureDirectory, 'src/lyrd'), { recursive: true, force: true })
  await rm(path.join(fixtureDirectory, 'src/overlays'), { recursive: true, force: true })
  await rm(path.join(fixtureDirectory, 'lyrd.json'), { force: true })
  if (name === 'next-app-router') {
    await rm(path.join(fixtureDirectory, 'src/app/lyrd-overlay-provider.tsx'), { force: true })
  }

  const packageJsonPath = path.join(fixtureDirectory, 'package.json')
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'))
  packageJson.dependencies['@lyrd/core'] = packageSpecs.core
  packageJson.devDependencies['@lyrd/cli'] = packageSpecs.cli
  await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`)

  return fixtureDirectory
}

async function verifyIsolatedInstallation(fixtureDirectory) {
  const lockfile = await readFile(path.join(fixtureDirectory, 'pnpm-lock.yaml'), 'utf8')
  assert.doesNotMatch(lockfile, /@lyrd\/(?:core|cli):[\s\S]{0,120}(?:link:|workspace:)/)

  for (const packageName of ['core', 'cli']) {
    const installedRoot = await realpath(
      path.join(fixtureDirectory, 'node_modules/@lyrd', packageName),
    )
    assert.equal(
      installedRoot.startsWith(repositoryRoot),
      false,
      `${packageName}이 workspace에서 연결되면 안 됩니다.`,
    )
  }
}

async function readInstalledVersions(fixtureDirectory) {
  const versions = {}
  for (const packageName of ['core', 'cli']) {
    const packageJson = JSON.parse(
      await readFile(
        path.join(fixtureDirectory, 'node_modules/@lyrd', packageName, 'package.json'),
        'utf8',
      ),
    )
    versions[packageName] = packageJson.version
  }
  return versions
}

function verifyInstalledVersions(name, actualVersions, expectedVersions) {
  if (!expectedVersions) return

  for (const packageName of ['core', 'cli']) {
    assert.equal(
      actualVersions[packageName],
      expectedVersions[packageName],
      `[consumer:registry] ${name}에 설치된 @lyrd/${packageName}@${actualVersions[packageName]}이(가) npm dist-tag ${registryTag}의 기대 버전 ${expectedVersions[packageName]}과 일치해야 합니다.`,
    )
  }
}

async function generateRenderers(name, fixtureDirectory) {
  const styling = name === 'next-app-router' ? 'tailwind-v4' : 'css-modules'
  await runCommand(
    pnpmCommand,
    ['exec', 'lyrd', 'add', 'overlay', '--style', styling, '--verbose'],
    fixtureDirectory,
  )
  await runCommand(pnpmCommand, ['exec', 'lyrd', 'add', 'dialog', 'consumer-lab'], fixtureDirectory)
  await runCommand(pnpmCommand, ['exec', 'lyrd', 'add', 'toast'], fixtureDirectory)

  if (name === 'next-app-router') {
    await writeFile(
      path.join(fixtureDirectory, 'src/app/lyrd-overlay-provider.tsx'),
      `'use client'

import type { ReactNode } from 'react'

import { OverlayProvider } from '../overlays/OverlayProvider'
import { AppToastProvider } from '../overlays/toast'

export function LyrdOverlayProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <AppToastProvider />
      <OverlayProvider>{children}</OverlayProvider>
    </>
  )
}
`,
    )
  }

  const overlayDirectory = path.join(fixtureDirectory, 'src/overlays')
  const expectedFiles = [
    'alert/AlertSurface.tsx',
    'confirm/ConfirmSurface.tsx',
    'OverlayProvider.tsx',
    ...(styling === 'css-modules' ? ['alert/Alert.module.css', 'confirm/Confirm.module.css'] : []),
    'toast/definition.ts',
    'toast/manager.ts',
    'toast/AppToastProvider.tsx',
    'toast/notify.ts',
    ...(styling === 'css-modules' ? ['toast/Toast.module.css'] : []),
    'dialogs/consumer-lab/ConsumerLabDialog.tsx',
  ]
  await Promise.all(expectedFiles.map((fileName) => access(path.join(overlayDirectory, fileName))))
}

async function verifyGeneratedBoundaries(name, fixtureDirectory) {
  const config = JSON.parse(await readFile(path.join(fixtureDirectory, 'lyrd.json'), 'utf8'))
  assert.equal(config.framework, name)
  assert.equal(config.styling, name === 'next-app-router' ? 'tailwind-v4' : 'css-modules')

  if (name !== 'next-app-router') return

  const provider = await readFile(
    path.join(fixtureDirectory, 'src/app/lyrd-overlay-provider.tsx'),
    'utf8',
  )
  const layout = await readFile(path.join(fixtureDirectory, 'src/app/layout.tsx'), 'utf8')
  assert.match(provider, /^'use client'/)
  assert.match(provider, /<AppToastProvider \/>/)
  assert.match(provider, /<OverlayProvider>\{children\}<\/OverlayProvider>/)
  assert.doesNotMatch(layout, /^['"]use client['"]/)
  assert.match(layout, /<LyrdOverlayProvider>\{children\}<\/LyrdOverlayProvider>/)
}

async function prepareFixture(name, temporaryRoot, packageSpecs, expectedVersions) {
  const fixtureDirectory = await copyFixture(name, temporaryRoot, packageSpecs)
  console.log(`\n[consumer:${mode}] ${name} clean install`)
  await runCommand(pnpmCommand, ['install', '--no-frozen-lockfile'], fixtureDirectory)
  await verifyIsolatedInstallation(fixtureDirectory)
  const versions = await readInstalledVersions(fixtureDirectory)
  verifyInstalledVersions(name, versions, expectedVersions)

  await generateRenderers(name, fixtureDirectory)
  await verifyGeneratedBoundaries(name, fixtureDirectory)
  await runCommand(pnpmCommand, ['typecheck'], fixtureDirectory)
  await runCommand(pnpmCommand, ['build'], fixtureDirectory)

  console.log(
    `[consumer:${mode}] ${name} built with @lyrd/core@${versions.core} and @lyrd/cli@${versions.cli}`,
  )
  return fixtureDirectory
}

async function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        reject(new Error('임시 server port를 할당하지 못했습니다.'))
        return
      }
      server.close(() => resolve(address.port))
    })
  })
}

async function waitForServer(url, processLogs) {
  const deadline = Date.now() + 60_000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // Production server가 준비될 때까지 재시도합니다.
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error(`Production server did not start at ${url}.\n${processLogs.join('')}`)
}

function startServer(name, fixtureDirectory, port) {
  const args =
    name === 'vite-react'
      ? ['preview', '--host', '127.0.0.1', '--port', String(port)]
      : ['start', '--hostname', '127.0.0.1', '--port', String(port)]
  const logs = []
  const child = spawn(pnpmCommand, args, {
    cwd: fixtureDirectory,
    detached: process.platform !== 'win32',
    env: { ...process.env, CI: 'true' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  child.stdout.on('data', (chunk) => logs.push(chunk.toString()))
  child.stderr.on('data', (chunk) => logs.push(chunk.toString()))
  return { child, logs }
}

async function stopServer(child) {
  if (child.exitCode !== null || child.signalCode !== null) return
  assert.ok(child.pid, 'Production server process id가 필요합니다.')

  const exit = new Promise((resolve) => child.once('exit', resolve))
  if (process.platform === 'win32') child.kill('SIGTERM')
  else process.kill(-child.pid, 'SIGTERM')
  await Promise.race([exit, new Promise((resolve) => setTimeout(resolve, 5_000))])

  if (child.exitCode === null && child.signalCode === null) {
    if (process.platform === 'win32') child.kill('SIGKILL')
    else process.kill(-child.pid, 'SIGKILL')
  }
}

async function verifyInBrowser(browser, name, fixtureDirectory) {
  const port = await getAvailablePort()
  const baseUrl = `http://127.0.0.1:${port}`
  const { child, logs } = startServer(name, fixtureDirectory, port)

  try {
    await waitForServer(name === 'next-app-router' ? `${baseUrl}/lab` : baseUrl, logs)
    const context = await browser.newContext()
    const page = await context.newPage()
    try {
      if (name === 'vite-react') await verifyViteConsumer(page, baseUrl)
      else await verifyNextConsumer(page, baseUrl)
    } finally {
      await context.close()
    }
    console.log(`[consumer:${mode}] ${name} browser runtime PASS`)
  } finally {
    await stopServer(child)
  }
}

const temporaryRoot = await mkdtemp(path.join(tmpdir(), `lyrd-consumers-${mode}-`))
let browser

try {
  const expectedVersions =
    mode === 'registry' ? await readExpectedRegistryVersions(registryTag) : undefined
  const packageSpecs =
    mode === 'local-package'
      ? Object.fromEntries(
          Object.entries(await createTarballs(temporaryRoot)).map(([name, tarballPath]) => [
            name,
            `file:${tarballPath}`,
          ]),
        )
      : { core: registryTag, cli: registryTag }

  const viteFixture = await prepareFixture(
    'vite-react',
    temporaryRoot,
    packageSpecs,
    expectedVersions,
  )
  const nextFixture = await prepareFixture(
    'next-app-router',
    temporaryRoot,
    packageSpecs,
    expectedVersions,
  )

  browser = await chromium.launch({ headless: true })
  await verifyInBrowser(browser, 'vite-react', viteFixture)
  await verifyInBrowser(browser, 'next-app-router', nextFixture)
  console.log(`\nPASS consumer regression matrix (${mode})`)
} finally {
  await browser?.close()
  await rm(temporaryRoot, { recursive: true, force: true })
}
