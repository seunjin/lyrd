import { access, readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { docsRoutes, staticRoutePaths } from '../apps/docs/src/docs-manifest.ts'

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))
const docsSourceRoot = join(repositoryRoot, 'apps/docs/src')
const docsDistRoot = join(repositoryRoot, 'apps/docs/dist')
const staticRouteSet = new Set(staticRoutePaths)
const failures = []

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name)
      return entry.isDirectory() ? listFiles(path) : [path]
    }),
  )
  return nested.flat()
}

for (const routePath of staticRoutePaths) {
  const entryPath =
    routePath === '/'
      ? join(docsDistRoot, 'index.html')
      : join(docsDistRoot, routePath.slice(1), 'index.html')
  try {
    await access(entryPath)
  } catch {
    failures.push(`정적 route entry가 없습니다: ${routePath}`)
  }
}

for (const asset of ['llms.txt', 'llms-full.txt']) {
  try {
    await access(join(docsDistRoot, asset))
  } catch {
    failures.push(`문서 build asset이 없습니다: ${asset}`)
  }
}

for (const route of docsRoutes) {
  const sourcePath = join(repositoryRoot, route.sourcePath)
  let source = ''
  try {
    source = await readFile(sourcePath, 'utf8')
  } catch {
    failures.push(`문서 source가 없습니다: ${route.sourcePath}`)
    continue
  }

  for (const item of route.toc) {
    if (!source.includes(`'${item.id}'`) && !source.includes(`"${item.id}"`)) {
      failures.push(`${route.path}의 목차 anchor를 source에서 찾지 못했습니다: #${item.id}`)
    }
  }
}

const sourceFiles = (await listFiles(docsSourceRoot)).filter((path) => /\.(?:ts|tsx)$/.test(path))
const internalPathPattern = /(?:to|path)\s*[:=]\s*['"](\/[^'"?#]*)/g

for (const sourcePath of sourceFiles) {
  const source = await readFile(sourcePath, 'utf8')
  for (const match of source.matchAll(internalPathPattern)) {
    const linkedPath = match[1]
    if (linkedPath && !staticRouteSet.has(linkedPath)) {
      failures.push(
        `정적 route에 없는 내부 링크입니다: ${linkedPath} (${sourcePath.slice(repositoryRoot.length + 1)})`,
      )
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`- ${failure}`)
  process.exitCode = 1
} else {
  console.log(
    `문서 route ${staticRoutePaths.length}개, 목차 ${docsRoutes.reduce((total, route) => total + route.toc.length, 0)}개와 내부 링크를 확인했습니다.`,
  )
}
