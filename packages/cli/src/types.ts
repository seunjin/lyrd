export type Framework = 'next-app-router' | 'vite-react' | 'unknown'

export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun'

export type Styling = 'css-modules' | 'tailwind-v4'

export interface LyrdConfig {
  $schema: string
  framework: Framework
  packageManager: PackageManager
  styling: Styling
  paths: {
    overlay: string
  }
  adapters: {
    overlay: 'base-ui'
  }
}
