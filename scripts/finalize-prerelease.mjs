import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const packageFiles = ['packages/core/package.json', 'packages/cli/package.json']

function npm(args, options = {}) {
  return execFileSync('npm', args, {
    encoding: 'utf8',
    stdio: options.capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
  })
}

for (const packageFile of packageFiles) {
  const { name, version } = JSON.parse(readFileSync(packageFile, 'utf8'))

  if (!version.includes('-next.')) {
    throw new Error(`${name}@${version}은 next 프리릴리스가 아닙니다.`)
  }

  npm(['access', 'set', 'status=public', name])
  npm(['dist-tag', 'add', `${name}@${version}`, 'next'])

  const latest = npm(['view', name, 'dist-tags.latest'], { capture: true }).trim()
  if (latest === version) {
    npm(['dist-tag', 'rm', name, 'latest'])
  }

  const tags = npm(['view', name, 'dist-tags', '--json'], { capture: true }).trim()
  console.log(`${name}: ${tags}`)
}
