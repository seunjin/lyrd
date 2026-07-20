import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import ts from 'typescript'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { run } from './cli'

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url))
const fixtureDirectories: string[] = []

async function createViteFixture(): Promise<string> {
  const fixtureDirectory = await mkdtemp(path.join(tmpdir(), 'lyrd-cli-'))
  fixtureDirectories.push(fixtureDirectory)

  await mkdir(path.join(fixtureDirectory, 'src'), { recursive: true })
  await symlink(
    path.join(repositoryRoot, 'packages/cli/node_modules'),
    path.join(fixtureDirectory, 'node_modules'),
    process.platform === 'win32' ? 'junction' : 'dir',
  )
  await writeFile(
    path.join(fixtureDirectory, 'package.json'),
    `${JSON.stringify(
      {
        private: true,
        dependencies: {
          '@base-ui/react': '*',
          '@lyrd/core': '*',
          react: '*',
          'react-dom': '*',
          vite: '*',
        },
      },
      null,
      2,
    )}\n`,
  )
  await writeFile(path.join(fixtureDirectory, 'src/main.tsx'), 'export {}\n')
  await writeFile(path.join(fixtureDirectory, 'src/styles.d.ts'), "declare module '*.css'\n")
  await writeFile(
    path.join(fixtureDirectory, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          lib: ['ES2022', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          moduleResolution: 'Bundler',
          jsx: 'react-jsx',
          strict: true,
          skipLibCheck: true,
          noEmit: true,
          paths: {
            '@lyrd/core': [path.join(repositoryRoot, 'packages/core/src/index.ts')],
          },
        },
        include: ['src/**/*.d.ts', 'src/lyrd/overlay/**/*.ts', 'src/lyrd/overlay/**/*.tsx'],
      },
      null,
      2,
    )}\n`,
  )

  return fixtureDirectory
}

async function createNextFixture(): Promise<string> {
  const fixtureDirectory = await mkdtemp(path.join(tmpdir(), 'lyrd-cli-next-'))
  fixtureDirectories.push(fixtureDirectory)

  await mkdir(path.join(fixtureDirectory, 'src', 'app'), { recursive: true })
  await symlink(
    path.join(repositoryRoot, 'packages/cli/node_modules'),
    path.join(fixtureDirectory, 'node_modules'),
    process.platform === 'win32' ? 'junction' : 'dir',
  )
  await writeFile(
    path.join(fixtureDirectory, 'package.json'),
    `${JSON.stringify(
      {
        private: true,
        dependencies: {
          '@base-ui/react': '*',
          '@lyrd/core': '*',
          next: '*',
          react: '*',
          'react-dom': '*',
        },
      },
      null,
      2,
    )}\n`,
  )
  await writeFile(path.join(fixtureDirectory, 'src', 'app', 'layout.tsx'), 'export {}\n')
  await writeFile(path.join(fixtureDirectory, 'src/styles.d.ts'), "declare module '*.css'\n")
  await writeFile(
    path.join(fixtureDirectory, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          lib: ['ES2022', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          moduleResolution: 'Bundler',
          jsx: 'react-jsx',
          strict: true,
          skipLibCheck: true,
          noEmit: true,
          paths: {
            '@lyrd/core': [path.join(repositoryRoot, 'packages/core/src/index.ts')],
          },
        },
        include: [
          'src/**/*.d.ts',
          'src/lyrd/overlay/**/*.ts',
          'src/lyrd/overlay/**/*.tsx',
          'src/app/**/*.tsx',
        ],
      },
      null,
      2,
    )}\n`,
  )

  return fixtureDirectory
}

function compileFixture(fixtureDirectory: string): string {
  const configPath = path.join(fixtureDirectory, 'tsconfig.json')
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile)
  const parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, fixtureDirectory)
  const program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options)
  const diagnostics = [...parsedConfig.errors, ...ts.getPreEmitDiagnostics(program)]

  return ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: (fileName) => fileName,
    getCurrentDirectory: () => fixtureDirectory,
    getNewLine: () => '\n',
  })
}

afterEach(async () => {
  vi.restoreAllMocks()
  await Promise.all(
    fixtureDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  )
})

describe('overlay CLI 통합', () => {
  it('실제 프로젝트에 생성하고 컴파일하며 사용자 수정을 보존한다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const fixtureDirectory = await createViteFixture()

    await expect(
      run(['add', 'overlay', '--cwd', fixtureDirectory, '--skip-install']),
    ).resolves.toBe(0)

    const overlayDirectory = path.join(fixtureDirectory, 'src/lyrd/overlay')
    await expect(
      Promise.all(
        ['alert.tsx', 'confirm.tsx', 'overlay-provider.tsx', 'overlay.css', 'index.ts'].map(
          (fileName) => readFile(path.join(overlayDirectory, fileName), 'utf8'),
        ),
      ),
    ).resolves.toHaveLength(5)

    const config = JSON.parse(await readFile(path.join(fixtureDirectory, 'lyrd.json'), 'utf8'))
    expect(config).toMatchObject({
      framework: 'vite-react',
      paths: { overlay: 'src/lyrd/overlay' },
      adapters: { overlay: 'base-ui' },
    })
    expect(compileFixture(fixtureDirectory)).toBe('')

    const alertPath = path.join(overlayDirectory, 'alert.tsx')
    const customizedAlert = `${await readFile(alertPath, 'utf8')}\n// 사용자 커스텀\n`
    await writeFile(alertPath, customizedAlert)

    await run(['add', 'overlay', '--cwd', fixtureDirectory, '--skip-install'])

    expect(await readFile(alertPath, 'utf8')).toBe(customizedAlert)
    expect(log.mock.calls.flat().join('\n')).toContain('Existing files were not overwritten')
    const indexContent = await readFile(path.join(overlayDirectory, 'index.ts'), 'utf8')
    expect(indexContent.match(/export \* from/g)).toHaveLength(3)

    await run(['add', 'dialog', 'project-settings', '--cwd', fixtureDirectory, '--verbose'])

    const dialogDirectory = path.join(overlayDirectory, 'dialogs')
    const dialogPath = path.join(dialogDirectory, 'project-settings-dialog.tsx')
    await expect(readFile(dialogPath, 'utf8')).resolves.toContain('ProjectSettingsDialog')
    await expect(readFile(path.join(dialogDirectory, 'dialog.css'), 'utf8')).resolves.toContain(
      '.lyrd-dialog-popup',
    )
    expect(compileFixture(fixtureDirectory)).toBe('')
    expect(log.mock.calls.flat().join('\n')).toContain(
      'overlay.dialog<ProjectSettingsDialogResult>',
    )

    const customizedDialog = `${await readFile(dialogPath, 'utf8')}\n// 사용자 커스텀\n`
    await writeFile(dialogPath, customizedDialog)
    await run(['add', 'dialog', 'project-settings', '--cwd', fixtureDirectory])

    expect(await readFile(dialogPath, 'utf8')).toBe(customizedDialog)

    await run(['add', 'toast', '--cwd', fixtureDirectory, '--verbose'])

    const toastPath = path.join(overlayDirectory, 'toast.tsx')
    await expect(readFile(toastPath, 'utf8')).resolves.toContain('export function AppToastProvider')
    await expect(
      readFile(path.join(overlayDirectory, 'toast-definition.ts'), 'utf8'),
    ).resolves.toContain('export const appToast')
    await expect(readFile(path.join(overlayDirectory, 'notify.ts'), 'utf8')).resolves.toContain(
      'export function notify',
    )
    await expect(
      readFile(path.join(overlayDirectory, 'toast-group.ts'), 'utf8'),
    ).resolves.toContain("strategy: 'parallel'")
    await expect(readFile(path.join(overlayDirectory, 'toast.css'), 'utf8')).resolves.toContain(
      '.lyrd-toast[data-limited]',
    )
    expect(compileFixture(fixtureDirectory)).toBe('')
    const output = log.mock.calls.flat().join('\n')
    expect(output).toContain('Runtime snippet (src/main.tsx)')
    expect(output).toContain("import { AppToastProvider } from './lyrd/overlay/toast'")
    expect(output).toContain("import { AppOverlayProvider } from './lyrd/overlay/overlay-provider'")

    const customizedToast = `${await readFile(toastPath, 'utf8')}\n// 사용자 커스텀\n`
    await writeFile(toastPath, customizedToast)
    await run(['add', 'toast', '--cwd', fixtureDirectory])

    expect(await readFile(toastPath, 'utf8')).toBe(customizedToast)
  })

  it('Vite의 커스텀 overlay 경로도 app root 기준 상대 import로 안내한다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const fixtureDirectory = await createViteFixture()

    await writeFile(
      path.join(fixtureDirectory, 'lyrd.json'),
      `${JSON.stringify(
        {
          framework: 'vite-react',
          packageManager: 'pnpm',
          paths: { overlay: 'src/features/overlays' },
          adapters: { overlay: 'base-ui' },
        },
        null,
        2,
      )}\n`,
    )

    await run(['add', 'overlay', '--cwd', fixtureDirectory, '--skip-install'])
    await run(['add', 'toast', '--cwd', fixtureDirectory, '--verbose'])

    const output = log.mock.calls.flat().join('\n')
    expect(output).toContain('Runtime snippet (src/main.tsx)')
    expect(output).toContain("import { AppToastProvider } from './features/overlays/toast'")
    expect(output).toContain(
      "import { AppOverlayProvider } from './features/overlays/overlay-provider'",
    )
  })

  it('Dialog 이름은 kebab-case만 허용하고 Overlay 설치를 요구한다', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const fixtureDirectory = await createViteFixture()

    await expect(
      run(['add', 'dialog', 'Project_Settings', '--cwd', fixtureDirectory]),
    ).rejects.toThrow('kebab-case')
    await expect(
      run(['add', 'dialog', 'project-settings', '--cwd', fixtureDirectory]),
    ).rejects.toThrow('먼저 lyrd add overlay')
    await expect(run(['add', 'toast', '--cwd', fixtureDirectory])).rejects.toThrow(
      '먼저 lyrd add overlay',
    )
  })

  it('Next App Router에는 별도 클라이언트 연결 파일을 생성하고 layout 수정만 안내한다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const fixtureDirectory = await createNextFixture()

    await expect(
      run(['add', 'overlay', '--cwd', fixtureDirectory, '--skip-install', '--verbose']),
    ).resolves.toBe(0)

    const providerPath = path.join(fixtureDirectory, 'src/app/lyrd-overlay-provider.tsx')
    const layoutPath = path.join(fixtureDirectory, 'src/app/layout.tsx')
    await expect(readFile(providerPath, 'utf8')).resolves.toContain('LyrdOverlayProvider')
    await expect(readFile(layoutPath, 'utf8')).resolves.toBe('export {}\n')
    expect(compileFixture(fixtureDirectory)).toBe('')

    const output = log.mock.calls.flat().join('\n')
    expect(output).toContain('src/app/layout.tsx')
    expect(output).toContain("import { LyrdOverlayProvider } from './lyrd-overlay-provider'")
    expect(output).toContain('verify the Provider is mounted once')

    const providerBeforeToast = await readFile(providerPath, 'utf8')
    await run(['add', 'toast', '--cwd', fixtureDirectory, '--verbose'])

    expect(await readFile(providerPath, 'utf8')).toBe(providerBeforeToast)
    expect(await readFile(layoutPath, 'utf8')).toBe('export {}\n')
    expect(compileFixture(fixtureDirectory)).toBe('')

    const toastOutput = log.mock.calls.flat().join('\n')
    expect(toastOutput).toContain('Runtime snippet (src/app/lyrd-overlay-provider.tsx)')
    expect(toastOutput).toContain("import { AppToastProvider } from '../lyrd/overlay/toast'")
    expect(toastOutput).toContain(
      "import { AppOverlayProvider } from '../lyrd/overlay/overlay-provider'",
    )
    expect(toastOutput).toContain(
      "keep LyrdOverlayProvider mounted from './lyrd-overlay-provider' in 'src/app/layout.tsx'",
    )

    const customizedProvider = `${await readFile(providerPath, 'utf8')}\n// 사용자 커스텀\n`
    await writeFile(providerPath, customizedProvider)
    await run(['add', 'overlay', '--cwd', fixtureDirectory, '--skip-install'])

    expect(await readFile(providerPath, 'utf8')).toBe(customizedProvider)
  })

  it('지원 구조를 감지하지 못하면 수동 Provider 연결을 명확히 안내한다', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const fixtureDirectory = await createViteFixture()
    await rm(path.join(fixtureDirectory, 'src/main.tsx'))

    await run(['add', 'overlay', '--cwd', fixtureDirectory, '--skip-install'])

    const output = log.mock.calls.flat().join('\n')
    expect(output).toContain('Framework detection failed')
    expect(output).toContain('Mount AppOverlayProvider manually')
  })
})
