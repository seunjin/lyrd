import { writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  ensureConfig,
  ensureDirectory,
  ensureIndexExport,
  findProjectRoot,
  fromProjectPath,
  installDependencies,
  isDependencyInstalled,
  pathExists,
  toPosixPath,
} from './project'
import { CLI_PACKAGE_SPECIFIER, OVERLAY_DEPENDENCIES } from './release-channel'
import {
  getDialogScaffoldFiles,
  getNextAppRouterProviderTemplate,
  getOverlayScaffoldFiles,
  getToastScaffoldFiles,
} from './templates'
import type { LyrdConfig } from './types'

interface ParsedArgs {
  positionals: string[]
  cwd: string
  help: boolean
  skipInstall: boolean
  verbose: boolean
}

interface RuntimeTarget {
  appRootFile: string | null
  importPath: string
  providerFile: string | null
  providerImportPath: string | null
}

interface RuntimeSnippet {
  title: string
  targetFile: string
  snippet: string
}

interface ToastRuntimeTarget {
  targetFile: string
  toastImportPath: string
  overlayProviderImportPath: string
}

const REPOSITORY_URL = 'https://github.com/seunjin/lyrd'

function printHelp(): void {
  console.log(`Lyrd CLI

Usage:
  lyrd init [--cwd <path>]
  lyrd add overlay [--cwd <path>] [--verbose]
  lyrd add dialog <name> [--cwd <path>] [--verbose]
  lyrd add toast [--cwd <path>] [--verbose]

Examples:
  pnpm dlx ${CLI_PACKAGE_SPECIFIER} add overlay
  pnpm dlx ${CLI_PACKAGE_SPECIFIER} add dialog project-settings
  pnpm dlx ${CLI_PACKAGE_SPECIFIER} add toast
  pnpm dlx ${CLI_PACKAGE_SPECIFIER} init
`)
}

function parseArgs(argv: string[]): ParsedArgs {
  const positionals: string[] = []
  let cwd = process.cwd()
  let help = false
  let skipInstall = false
  let verbose = false

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (!arg) {
      continue
    }

    if (arg === '--help' || arg === '-h') {
      help = true
      continue
    }

    if (arg === '--skip-install') {
      skipInstall = true
      continue
    }

    if (arg === '--verbose' || arg === '-v') {
      verbose = true
      continue
    }

    if (arg === '--cwd') {
      const value = argv[index + 1]
      if (!value) {
        throw new Error('Missing value for --cwd')
      }
      cwd = path.resolve(value)
      index += 1
      continue
    }

    if (arg.startsWith('--cwd=')) {
      cwd = path.resolve(arg.slice('--cwd='.length))
      continue
    }

    positionals.push(arg)
  }

  return { positionals, cwd, help, skipInstall, verbose }
}

function formatRelativePath(projectRoot: string, filePath: string): string {
  const relative = path.relative(projectRoot, filePath)
  return relative ? toPosixPath(relative) : '.'
}

function getOverlayPath(config: LyrdConfig): string {
  if (!config.paths?.overlay || config.adapters?.overlay !== 'base-ui') {
    throw new Error(
      '기존 lyrd.json은 vNext와 호환되지 않습니다. 파일을 제거한 뒤 다시 실행해 주세요.',
    )
  }
  return config.paths.overlay
}

function toRelativeImport(fromFile: string, toFile: string): string {
  const fromDir = path.posix.dirname(toPosixPath(fromFile))
  const relative = path.posix.relative(fromDir, toPosixPath(toFile))
  return relative.startsWith('.') ? relative : `./${relative}`
}

async function getRuntimeTarget(
  projectRoot: string,
  framework: string,
  overlayPath: string,
): Promise<RuntimeTarget> {
  if (framework === 'vite-react') {
    const appRootFile = (await pathExists(path.join(projectRoot, 'src/main.jsx')))
      ? 'src/main.jsx'
      : 'src/main.tsx'

    return {
      appRootFile,
      importPath: toRelativeImport(appRootFile, `${overlayPath}/overlay-provider`),
      providerFile: null,
      providerImportPath: null,
    }
  }

  if (framework === 'next-app-router') {
    const appDirectory = overlayPath.startsWith('src/') ? 'src/app' : 'app'
    const appRootFile = `${appDirectory}/layout.tsx`
    const providerFile = `${appDirectory}/lyrd-overlay-provider.tsx`

    return {
      appRootFile,
      importPath: toRelativeImport(appRootFile, providerFile.replace(/\.tsx$/, '')),
      providerFile,
      providerImportPath: toRelativeImport(providerFile, `${overlayPath}/overlay-provider`),
    }
  }

  return {
    appRootFile: null,
    importPath: `${overlayPath}/overlay-provider`,
    providerFile: null,
    providerImportPath: null,
  }
}

function getToastRuntimeTarget(
  runtimeTarget: RuntimeTarget,
  overlayPath: string,
): ToastRuntimeTarget {
  const targetFile = runtimeTarget.providerFile ?? runtimeTarget.appRootFile

  if (!targetFile) {
    return {
      targetFile: 'your app root',
      toastImportPath: `${overlayPath}/toast`,
      overlayProviderImportPath: `${overlayPath}/overlay-provider`,
    }
  }

  return {
    targetFile,
    toastImportPath: toRelativeImport(targetFile, `${overlayPath}/toast`),
    overlayProviderImportPath: toRelativeImport(targetFile, `${overlayPath}/overlay-provider`),
  }
}

function getOverlayRuntimeSnippet(framework: string, providerImportPath: string): string {
  if (framework === 'vite-react') {
    return `import { AppOverlayProvider } from '${providerImportPath}'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppOverlayProvider>
      <App />
    </AppOverlayProvider>
  </StrictMode>,
)`
  }

  if (framework === 'next-app-router') {
    return `import { LyrdOverlayProvider } from '${providerImportPath}'

<body>
  <LyrdOverlayProvider>{children}</LyrdOverlayProvider>
</body>`
  }

  return `import { AppOverlayProvider } from '${providerImportPath}'

export function AppRoot() {
  return <AppOverlayProvider><App /></AppOverlayProvider>
}`
}

function printList(title: string, items: string[]): void {
  if (items.length === 0) {
    return
  }

  console.log(`\n${title}:`)
  for (const item of items) {
    console.log(`- ${item}`)
  }
}

async function writeScaffoldFile(
  filePath: string,
  content: string,
): Promise<'created' | 'skipped'> {
  if (await pathExists(filePath)) {
    return 'skipped'
  }

  await writeFile(filePath, content, 'utf8')
  return 'created'
}

async function runInit(cwd: string): Promise<number> {
  const projectRoot = await findProjectRoot(cwd)
  const { config, configPath, created } = await ensureConfig(projectRoot)
  await ensureDirectory(fromProjectPath(projectRoot, getOverlayPath(config)))

  if (created) {
    console.log(`Created ${formatRelativePath(projectRoot, configPath)}`)
  } else {
    console.log(`Using existing ${formatRelativePath(projectRoot, configPath)}`)
  }

  console.log(`Framework: ${config.framework}`)
  console.log(`Package manager: ${config.packageManager}`)
  console.log(`Overlay path: ${getOverlayPath(config)}`)

  return 0
}

async function runAddOverlay(cwd: string, skipInstall: boolean, verbose: boolean): Promise<number> {
  const projectRoot = await findProjectRoot(cwd)
  const { config, configPath, created } = await ensureConfig(projectRoot)
  const overlayPath = getOverlayPath(config)
  const overlayDir = fromProjectPath(projectRoot, overlayPath)
  const indexFilePath = toPosixPath(path.join(overlayPath, 'index.ts'))

  const createdPaths: string[] = []
  const skippedPaths: string[] = []
  const updatedPaths = new Set<string>()
  const nextSteps: string[] = []
  const docs = [`${REPOSITORY_URL}#readme`]
  const runtimeSnippets: RuntimeSnippet[] = []

  if (created) {
    createdPaths.push(formatRelativePath(projectRoot, configPath))
  }

  await ensureDirectory(overlayDir)

  const missingPackages: Array<(typeof OVERLAY_DEPENDENCIES)[number]> = []
  for (const requiredPackage of OVERLAY_DEPENDENCIES) {
    if (await isDependencyInstalled(projectRoot, requiredPackage.name)) {
      console.log(`Using existing ${requiredPackage.name}`)
    } else {
      missingPackages.push(requiredPackage)
    }
  }

  if (missingPackages.length > 0) {
    if (skipInstall) {
      console.log(`Skipping install for ${missingPackages.map(({ name }) => name).join(', ')}`)
    } else {
      console.log(`Installing ${missingPackages.map(({ specifier }) => specifier).join(', ')}...`)
      await installDependencies(
        projectRoot,
        config.packageManager,
        missingPackages.map(({ specifier }) => specifier),
      )
    }
  }

  docs.push(`${REPOSITORY_URL}/blob/main/docs/rfcs/0001-overlay-intent-system.md`)
  for (const file of getOverlayScaffoldFiles()) {
    const targetPath = path.join(overlayDir, file.name)
    const result = await writeScaffoldFile(targetPath, file.content)
    const formattedPath = formatRelativePath(projectRoot, targetPath)
    if (result === 'created') {
      createdPaths.push(formattedPath)
    } else {
      skippedPaths.push(formattedPath)
    }
  }

  for (const exportName of ['alert', 'confirm', 'overlay-provider']) {
    const indexStatus = await ensureIndexExport(projectRoot, overlayPath, exportName)
    if (indexStatus !== 'skipped') {
      updatedPaths.add(indexFilePath)
    }
  }

  const runtimeTarget = await getRuntimeTarget(projectRoot, config.framework, overlayPath)

  if (runtimeTarget.providerFile && runtimeTarget.providerImportPath) {
    const providerPath = fromProjectPath(projectRoot, runtimeTarget.providerFile)
    const result = await writeScaffoldFile(
      providerPath,
      getNextAppRouterProviderTemplate(runtimeTarget.providerImportPath),
    )
    const formattedPath = formatRelativePath(projectRoot, providerPath)
    if (result === 'created') {
      createdPaths.push(formattedPath)
    } else {
      skippedPaths.push(formattedPath)
    }
  }

  nextSteps.push(
    `Mount ${runtimeTarget.providerFile ? 'LyrdOverlayProvider' : 'AppOverlayProvider'} from '${runtimeTarget.importPath}' once in ${runtimeTarget.appRootFile ?? 'your app root'}`,
  )

  if (verbose) {
    runtimeSnippets.push({
      title: 'Overlay runtime',
      targetFile: runtimeTarget.appRootFile ?? 'your app root',
      snippet: getOverlayRuntimeSnippet(config.framework, runtimeTarget.importPath),
    })
  }

  console.log('\nAdded overlay')
  console.log(`Local overlay path: ${overlayPath}`)

  if (createdPaths.length > 0) {
    printList('Created', createdPaths)
  }

  if (updatedPaths.size > 0) {
    printList('Updated', [...updatedPaths])
  }

  if (createdPaths.length === 0 && updatedPaths.size === 0) {
    console.log('\nNo new files were created.')
  }

  if (skippedPaths.length > 0) {
    printList('Kept existing', skippedPaths)
  }

  if (nextSteps.length > 0) {
    printList('Next step', [...new Set(nextSteps)])
  }

  printList('Docs', [...new Set(docs)])

  if (runtimeSnippets.length > 0) {
    console.log('\nRuntime snippets:')
    for (const runtimeSnippet of runtimeSnippets) {
      console.log(`\n${runtimeSnippet.title} (${runtimeSnippet.targetFile}):\n`)
      console.log(runtimeSnippet.snippet)
    }
  } else if (nextSteps.length > 0) {
    console.log('\nTip:')
    console.log('- Run the same command with --verbose to print the full runtime snippets')
  }

  return 0
}

function getDialogNames(dialogName: string): {
  componentName: string
  fileName: string
  resultName: string
} {
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(dialogName)) {
    throw new Error('Dialog 이름은 project-settings 같은 kebab-case 형식이어야 합니다.')
  }

  const baseName = dialogName
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('')

  return {
    componentName: `${baseName}Dialog`,
    fileName: `${dialogName}-dialog`,
    resultName: `${baseName}DialogResult`,
  }
}

async function runAddDialog(dialogName: string, cwd: string, verbose: boolean): Promise<number> {
  const names = getDialogNames(dialogName)
  const projectRoot = await findProjectRoot(cwd)
  const { config } = await ensureConfig(projectRoot)
  const overlayPath = getOverlayPath(config)
  const overlayProviderPath = fromProjectPath(projectRoot, `${overlayPath}/overlay-provider.tsx`)

  if (!(await pathExists(overlayProviderPath))) {
    throw new Error('먼저 lyrd add overlay를 실행해 OverlayProvider를 설치해 주세요.')
  }

  const dialogPath = toPosixPath(path.join(overlayPath, 'dialogs'))
  const dialogDir = fromProjectPath(projectRoot, dialogPath)
  const createdPaths: string[] = []
  const skippedPaths: string[] = []
  const updatedPaths = new Set<string>()

  await ensureDirectory(dialogDir)

  for (const file of getDialogScaffoldFiles(dialogName)) {
    const targetPath = path.join(dialogDir, file.name)
    const result = await writeScaffoldFile(targetPath, file.content)
    const formattedPath = formatRelativePath(projectRoot, targetPath)
    if (result === 'created') {
      createdPaths.push(formattedPath)
    } else {
      skippedPaths.push(formattedPath)
    }
  }

  const dialogIndexStatus = await ensureIndexExport(projectRoot, dialogPath, names.fileName)
  if (dialogIndexStatus !== 'skipped') {
    updatedPaths.add(`${dialogPath}/index.ts`)
  }

  const overlayIndexStatus = await ensureIndexExport(projectRoot, overlayPath, 'dialogs')
  if (overlayIndexStatus !== 'skipped') {
    updatedPaths.add(`${overlayPath}/index.ts`)
  }

  console.log(`\nAdded dialog ${dialogName}`)
  console.log(`Local dialog path: ${dialogPath}/${names.fileName}.tsx`)
  printList('Created', createdPaths)
  printList('Updated', [...updatedPaths])

  if (createdPaths.length === 0 && updatedPaths.size === 0) {
    console.log('\nNo new files were created.')
  }

  printList('Kept existing', skippedPaths)
  printList('Next step', [
    `Open ${names.componentName} with overlay.dialog<${names.resultName}>(<${names.componentName} />)`,
  ])
  printList('Docs', [`${REPOSITORY_URL}/blob/main/docs/rfcs/0002-registered-overlay-contract.md`])

  if (verbose) {
    console.log(`\nRuntime snippet (${names.fileName}.tsx):\n`)
    console.log(`const result = await overlay.dialog<${names.resultName}>(
  <${names.componentName} />,
)`)
  } else {
    console.log('\nTip:')
    console.log('- Run the same command with --verbose to print the full runtime snippet')
  }

  return 0
}

async function runAddToast(cwd: string, verbose: boolean): Promise<number> {
  const projectRoot = await findProjectRoot(cwd)
  const { config } = await ensureConfig(projectRoot)
  const overlayPath = getOverlayPath(config)
  const overlayProviderPath = fromProjectPath(projectRoot, `${overlayPath}/overlay-provider.tsx`)

  if (!(await pathExists(overlayProviderPath))) {
    throw new Error('먼저 lyrd add overlay를 실행해 OverlayProvider를 설치해 주세요.')
  }

  const overlayDir = fromProjectPath(projectRoot, overlayPath)
  const runtimeTarget = await getRuntimeTarget(projectRoot, config.framework, overlayPath)
  const toastRuntimeTarget = getToastRuntimeTarget(runtimeTarget, overlayPath)
  const createdPaths: string[] = []
  const skippedPaths: string[] = []
  const updatedPaths = new Set<string>()

  for (const file of getToastScaffoldFiles()) {
    const targetPath = path.join(overlayDir, file.name)
    const result = await writeScaffoldFile(targetPath, file.content)
    const formattedPath = formatRelativePath(projectRoot, targetPath)
    if (result === 'created') {
      createdPaths.push(formattedPath)
    } else {
      skippedPaths.push(formattedPath)
    }
  }

  for (const exportName of ['toast-definition', 'toast', 'toast-group', 'notify']) {
    const indexStatus = await ensureIndexExport(projectRoot, overlayPath, exportName)
    if (indexStatus !== 'skipped') {
      updatedPaths.add(`${overlayPath}/index.ts`)
    }
  }

  console.log('\nAdded toast')
  console.log(`Local toast path: ${overlayPath}/toast.tsx`)
  printList('Created', createdPaths)
  printList('Updated', [...updatedPaths])

  if (createdPaths.length === 0 && updatedPaths.size === 0) {
    console.log('\nNo new files were created.')
  }

  printList('Kept existing', skippedPaths)
  printList('Next step', [
    runtimeTarget.providerFile
      ? `Wrap AppOverlayProvider with AppToastProvider in '${toastRuntimeTarget.targetFile}' and keep LyrdOverlayProvider mounted from '${runtimeTarget.importPath}' in '${runtimeTarget.appRootFile}'.`
      : `Wrap AppOverlayProvider with AppToastProvider once in '${toastRuntimeTarget.targetFile}'.`,
    'Use notify() for fire-and-forget messages or notifyWithUndo() for actionable Toasts.',
  ])
  printList('Docs', [
    `${REPOSITORY_URL}/blob/main/docs/rfcs/0003-overlay-definition-and-policy-layers.md`,
  ])

  if (verbose) {
    console.log(`\nRuntime snippet (${toastRuntimeTarget.targetFile}):\n`)
    console.log(`import { AppToastProvider } from '${toastRuntimeTarget.toastImportPath}'
import { AppOverlayProvider } from '${toastRuntimeTarget.overlayProviderImportPath}'

<AppToastProvider>
  <AppOverlayProvider>{children}</AppOverlayProvider>
</AppToastProvider>`)
    console.log('\nNotify snippets:\n')
    console.log(`notify(overlay, {
  title: '변경 사항을 저장했습니다.',
})

const action = await notifyWithUndo(overlay, {
  title: '항목을 삭제했습니다.',
  description: '필요하면 실행 취소할 수 있습니다.',
})

if (action === 'undo') {
  await undoDelete()
}`)
  } else {
    console.log('\nTip:')
    console.log('- Run the same command with --verbose to print the provider and notify snippets')
  }

  return 0
}

async function runAdd(
  features: string[],
  cwd: string,
  skipInstall: boolean,
  verbose: boolean,
): Promise<number> {
  if (features.length === 1 && features[0] === 'overlay') {
    return runAddOverlay(cwd, skipInstall, verbose)
  }

  if (features.length === 2 && features[0] === 'dialog' && features[1]) {
    return runAddDialog(features[1], cwd, verbose)
  }

  if (features.length === 1 && features[0] === 'toast') {
    return runAddToast(cwd, verbose)
  }

  throw new Error('지원하는 명령: lyrd add overlay, lyrd add dialog <name>, lyrd add toast')
}

export async function run(argv: string[]): Promise<number> {
  const parsed = parseArgs(argv)

  if (parsed.help || parsed.positionals.length === 0) {
    printHelp()
    return 0
  }

  const [command, ...rest] = parsed.positionals

  if (command === 'init') {
    return runInit(parsed.cwd)
  }

  if (command === 'add') {
    return runAdd(rest, parsed.cwd, parsed.skipInstall, parsed.verbose)
  }

  throw new Error(`Unknown command "${command}"`)
}
