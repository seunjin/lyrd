import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { access, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const cliRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const coreRoot = path.resolve(cliRoot, '../core')
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, CI: 'true' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr })
        return
      }

      reject(
        new Error(
          `${command} ${args.join(' ')} failed with exit code ${code ?? 'unknown'}\n${stdout}\n${stderr}`,
        ),
      )
    })
  })
}

async function pathExists(targetPath) {
  try {
    await access(targetPath)
    return true
  } catch {
    return false
  }
}

async function main() {
  const reactPackage = JSON.parse(
    await readFile(path.join(coreRoot, 'node_modules/react/package.json'), 'utf8'),
  )
  const reactDomPackage = JSON.parse(
    await readFile(path.join(coreRoot, 'node_modules/react-dom/package.json'), 'utf8'),
  )
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'lyrd-cli-package-'))
  const cliPackDirectory = path.join(temporaryRoot, 'pack/cli')
  const corePackDirectory = path.join(temporaryRoot, 'pack/core')
  const fixtureDirectory = path.join(temporaryRoot, 'fixture')

  try {
    await mkdir(cliPackDirectory, { recursive: true })
    await mkdir(corePackDirectory, { recursive: true })
    await mkdir(path.join(fixtureDirectory, 'src'), { recursive: true })
    await writeFile(
      path.join(fixtureDirectory, 'package.json'),
      `${JSON.stringify({ name: 'lyrd-cli-package-fixture', private: true }, null, 2)}\n`,
    )

    await runCommand(pnpmCommand, ['pack', '--pack-destination', cliPackDirectory], cliRoot)
    await runCommand(pnpmCommand, ['pack', '--pack-destination', corePackDirectory], coreRoot)

    const cliTarballs = (await readdir(cliPackDirectory)).filter((fileName) =>
      fileName.endsWith('.tgz'),
    )
    const coreTarballs = (await readdir(corePackDirectory)).filter((fileName) =>
      fileName.endsWith('.tgz'),
    )
    assert.equal(cliTarballs.length, 1, 'CLI 배포 tarball이 정확히 하나 생성되어야 합니다.')
    assert.equal(coreTarballs.length, 1, 'core 배포 tarball이 정확히 하나 생성되어야 합니다.')

    const cliTarballPath = path.join(cliPackDirectory, cliTarballs[0])
    const coreTarballPath = path.join(corePackDirectory, coreTarballs[0])
    await runCommand(
      pnpmCommand,
      [
        'add',
        '--offline',
        '--ignore-scripts',
        '--save-exact',
        cliTarballPath,
        coreTarballPath,
        `react@${reactPackage.version}`,
        `react-dom@${reactDomPackage.version}`,
      ],
      fixtureDirectory,
    )

    const installedCliRoot = path.join(fixtureDirectory, 'node_modules/@lyrd/cli')
    const installedPackage = JSON.parse(
      await readFile(path.join(installedCliRoot, 'package.json'), 'utf8'),
    )
    assert.deepEqual(installedPackage.bin, { lyrd: './dist/bin.js' })
    assert.equal(await pathExists(path.join(installedCliRoot, 'dist/bin.js')), true)
    assert.equal(await pathExists(path.join(installedCliRoot, 'LICENSE')), true)
    assert.equal(
      await pathExists(path.join(installedCliRoot, 'src')),
      false,
      '배포물에는 소스 디렉터리가 포함되지 않아야 합니다.',
    )

    const installedCoreRoot = path.join(fixtureDirectory, 'node_modules/@lyrd/core')
    assert.equal(await pathExists(path.join(installedCoreRoot, 'README.md')), true)
    assert.equal(await pathExists(path.join(installedCoreRoot, 'LICENSE')), true)
    assert.equal(await pathExists(path.join(installedCoreRoot, 'dist/index.d.ts')), true)
    assert.equal(await pathExists(path.join(installedCoreRoot, 'dist/index.d.cts')), true)
    assert.equal(await pathExists(path.join(installedCoreRoot, 'src')), false)
    const coreDeclarations = await readFile(path.join(installedCoreRoot, 'dist/index.d.ts'), 'utf8')
    assert.match(coreDeclarations, /createOverlayScope/)
    assert.match(coreDeclarations, /useOverlaySession/)
    assert.doesNotMatch(coreDeclarations, /createOverlayController/)
    assert.doesNotMatch(coreDeclarations, /defineOverlay/)
    assert.doesNotMatch(coreDeclarations, /openOrUpdate/)
    assert.doesNotMatch(coreDeclarations, /dismissAll/)
    assert.doesNotMatch(
      coreDeclarations,
      /OverlayController|OverlayDefinition|OverlayGroup|OverlayApi|OverlayDismissReason|DialogOptions|AlertSurfaceProps|ConfirmSurfaceProps/,
    )

    const esmImport = await runCommand(
      'node',
      [
        '--input-type=module',
        '--eval',
        "import { createElement } from 'react'; import * as core from '@lyrd/core'; const scope = core.createOverlayScope(); const client = scope.createClient(); const handle = client.open(createElement('div')); if (typeof core.useOverlaySession !== 'function' || typeof core.createOverlayController !== 'undefined' || typeof core.defineOverlay !== 'undefined' || typeof client.close !== 'function' || typeof client.closeAll !== 'function' || typeof client.openOrUpdate !== 'undefined' || !(handle instanceof Promise) || typeof handle.close !== 'function' || typeof handle.update !== 'undefined' || !handle.close()) process.exit(1); const outcome = await handle; if (outcome.status !== 'closed' || outcome.reason !== 'programmatic') process.exit(1)",
      ],
      fixtureDirectory,
    )
    assert.equal(esmImport.stderr, '')

    const cjsImport = await runCommand(
      'node',
      [
        '--eval',
        "const { createElement } = require('react'); const core = require('@lyrd/core'); const scope = core.createOverlayScope(); const client = scope.createClient(); const handle = client.open(createElement('div')); if (typeof core.useOverlaySession !== 'function' || typeof core.createOverlayController !== 'undefined' || typeof core.defineOverlay !== 'undefined' || typeof client.close !== 'function' || typeof client.closeAll !== 'function' || typeof client.openOrUpdate !== 'undefined' || !(handle instanceof Promise) || typeof handle.close !== 'function' || typeof handle.update !== 'undefined' || !handle.close()) process.exit(1); handle.then((outcome) => { if (outcome.status !== 'closed' || outcome.reason !== 'programmatic') process.exit(1) })",
      ],
      fixtureDirectory,
    )
    assert.equal(cjsImport.stderr, '')

    const help = await runCommand(pnpmCommand, ['exec', 'lyrd', '--help'], fixtureDirectory)
    assert.match(help.stdout, /lyrd add overlay/)
    assert.match(help.stdout, /lyrd add dialog <name>/)
    assert.match(help.stdout, /lyrd add toast/)

    const add = await runCommand(
      pnpmCommand,
      ['exec', 'lyrd', 'add', 'overlay', '--style', 'css-modules', '--skip-install'],
      fixtureDirectory,
    )
    assert.match(add.stdout, /Added overlay/)
    assert.match(add.stdout, /Using existing @lyrd\/core/)
    assert.match(add.stdout, /Skipping install for @base-ui\/react/)

    const overlayDirectory = path.join(fixtureDirectory, 'src/overlays')
    await Promise.all(
      [
        'alert/AlertSurface.tsx',
        'alert/Alert.module.css',
        'confirm/ConfirmSurface.tsx',
        'confirm/Confirm.module.css',
        'OverlayProvider.tsx',
        'index.ts',
      ].map((fileName) => access(path.join(overlayDirectory, fileName))),
    )

    const dialog = await runCommand(
      pnpmCommand,
      ['exec', 'lyrd', 'add', 'dialog', 'project-settings'],
      fixtureDirectory,
    )
    assert.match(dialog.stdout, /Added dialog project-settings/)
    await Promise.all(
      ['ProjectSettingsDialog.tsx', 'ProjectSettingsDialog.module.css', 'index.ts'].map(
        (fileName) => access(path.join(overlayDirectory, 'dialogs', 'project-settings', fileName)),
      ),
    )

    const toast = await runCommand(pnpmCommand, ['exec', 'lyrd', 'add', 'toast'], fixtureDirectory)
    assert.match(toast.stdout, /Added toast/)
    await Promise.all(
      ['definition.ts', 'manager.ts', 'AppToastProvider.tsx', 'notify.ts', 'Toast.module.css'].map(
        (fileName) => access(path.join(overlayDirectory, 'toast', fileName)),
      ),
    )

    const config = JSON.parse(await readFile(path.join(fixtureDirectory, 'lyrd.json'), 'utf8'))
    assert.equal(config.framework, 'unknown')
    assert.equal(config.paths.overlay, 'src/overlays')
    assert.equal(config.adapters.overlay, 'base-ui')
    assert.equal(config.styling, 'css-modules')

    console.log('PASS packaged lyrd CLI')
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true })
  }
}

await main()
