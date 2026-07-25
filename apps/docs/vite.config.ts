import { readFileSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'

import { staticRoutePaths } from './src/docs-manifest'

const outputDirectory = fileURLToPath(new URL('./dist', import.meta.url))
const corePackage = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../packages/core/package.json', import.meta.url)), 'utf8'),
) as { version: string }
const cliPackage = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../packages/cli/package.json', import.meta.url)), 'utf8'),
) as { version: string }

function emitStaticRouteEntries(): Plugin {
  return {
    name: 'emit-static-route-entries',
    apply: 'build',
    async closeBundle() {
      const appShell = await readFile(join(outputDirectory, 'index.html'), 'utf8')

      await Promise.all(
        staticRoutePaths
          .filter((routePath) => routePath !== '/')
          .map(async (routePath) => {
            const routeDirectory = join(outputDirectory, routePath.replace(/^\//, ''))
            await mkdir(routeDirectory, { recursive: true })
            await writeFile(join(routeDirectory, 'index.html'), appShell)
          }),
      )

      await writeFile(join(outputDirectory, '404.html'), appShell)
    },
  }
}

export default defineConfig({
  base: '/lyrd/',
  define: {
    __LYRD_CLI_VERSION__: JSON.stringify(cliPackage.version),
    __LYRD_CORE_VERSION__: JSON.stringify(corePackage.version),
  },
  plugins: [react(), emitStaticRouteEntries()],
  resolve: {
    alias: {
      '@lyrd/core': fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)),
    },
  },
})
