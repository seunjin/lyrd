import packageJson from '../package.json'

export function getPackageSpecifier(packageName: string, version = packageJson.version): string {
  const prereleaseTag = version.match(/^[^-]+-([^.]+)/)?.[1]
  return prereleaseTag ? `${packageName}@${prereleaseTag}` : packageName
}

export const CLI_PACKAGE_SPECIFIER = getPackageSpecifier('@lyrd/cli')
export const CORE_PACKAGE_SPECIFIER = getPackageSpecifier('@lyrd/core')
export const OVERLAY_DEPENDENCIES = [
  { name: '@lyrd/core', specifier: CORE_PACKAGE_SPECIFIER },
  { name: '@base-ui/react', specifier: '@base-ui/react' },
] as const
