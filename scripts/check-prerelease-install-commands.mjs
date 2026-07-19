import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url))
const documentationTargets = [
  'README.md',
  'docs',
  'apps/docs/public',
  'apps/docs/src',
  'packages/core/README.md',
  'packages/cli/README.md',
  'packages/cli/src/cli.ts',
]
const documentationExtensions = new Set(['.md', '.mdx', '.txt', '.ts', '.tsx'])
const unsupportedCommands = [
  {
    description: 'CLI 실행 명령에는 @next가 필요합니다.',
    pattern: /(?:pnpm dlx|npm exec|npx|yarn dlx|bunx) @lyrd\/cli(?!@next\b)/g,
  },
  {
    description: 'Core 설치 명령에는 @next가 필요합니다.',
    pattern: /(?:pnpm add|npm (?:install|i)|yarn add|bun add) @lyrd\/core(?!@next\b)/g,
  },
]

async function collectDocumentationFiles(target) {
  const absoluteTarget = path.join(repositoryRoot, target)
  const entries = await readdir(absoluteTarget, { withFileTypes: true }).catch(() => null)

  if (!entries) return [absoluteTarget]

  const files = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory()
        ? collectDocumentationFiles(path.join(target, entry.name))
        : Promise.resolve([path.join(absoluteTarget, entry.name)]),
    ),
  )

  return files.flat().filter((file) => documentationExtensions.has(path.extname(file)))
}

const documentationFiles = (
  await Promise.all(documentationTargets.map(collectDocumentationFiles))
).flat()
const violations = []

for (const file of documentationFiles) {
  const content = await readFile(file, 'utf8')
  const lines = content.split('\n')

  for (const { description, pattern } of unsupportedCommands) {
    for (const [index, line] of lines.entries()) {
      pattern.lastIndex = 0
      if (pattern.test(line)) {
        violations.push(
          `${path.relative(repositoryRoot, file)}:${index + 1} ${description} ${line.trim()}`,
        )
      }
    }
  }
}

if (violations.length > 0) {
  console.error(['프리릴리스 설치 명령을 확인해 주세요.', ...violations].join('\n'))
  process.exitCode = 1
} else {
  console.log('프리릴리스 문서의 @next 설치 명령을 확인했습니다.')
}
