import type { StorybookConfig } from '@storybook/react-vite'
import type { Plugin } from 'vite'

const STORYBOOK_PREVIEW_CHUNK_WARNING_LIMIT_KB = 1150
const USE_CLIENT_DIRECTIVE_PATTERN = /^[\t ]*(['"])use client\1;?/

function stripLocalUseClientDirectives(): Plugin {
  return {
    name: 'strip-storybook-use-client-directives',
    enforce: 'pre',
    transform(code, id) {
      const normalizedId = id.replaceAll('\\', '/')

      if (!normalizedId.includes('/apps/storybook/src/')) return
      if (!USE_CLIENT_DIRECTIVE_PATTERN.test(code)) return

      return code.replace(USE_CLIENT_DIRECTIVE_PATTERN, '')
    },
  }
}

function storybookManualChunk(id: string) {
  const normalizedId = id.replaceAll('\\', '/')

  if (normalizedId.includes('/node_modules/@base-ui/')) return 'base-ui'
  if (normalizedId.includes('/packages/core/')) return 'lyrd-core'
  if (normalizedId.includes('/apps/storybook/src/overlays/')) return 'lyrd-overlay-preview'
}

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  async viteFinal(config) {
    const { mergeConfig } = await import('vite')
    const previousOnWarn = config.build?.rollupOptions?.onwarn

    return mergeConfig(config, {
      plugins: [stripLocalUseClientDirectives()],
      build: {
        // Storybook 10 ships its preview runtime as one large module. Stories and app
        // dependencies are split below, so keep a strict ceiling for runtime regressions.
        chunkSizeWarningLimit: STORYBOOK_PREVIEW_CHUNK_WARNING_LIMIT_KB,
        rollupOptions: {
          onwarn(warning, warn) {
            // React client directives are meaningful to RSC bundlers, but Storybook's
            // preview is an exclusively client-side Vite application.
            if (
              warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
              warning.message.includes('"use client"')
            ) {
              return
            }

            if (previousOnWarn) {
              previousOnWarn(warning, warn)
              return
            }

            warn(warning)
          },
          output: {
            manualChunks: storybookManualChunk,
          },
        },
      },
    })
  },
}

export default config
