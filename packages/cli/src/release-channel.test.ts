import { describe, expect, it } from 'vitest'

import {
  CLI_PACKAGE_SPECIFIER,
  CORE_PACKAGE_SPECIFIER,
  getPackageSpecifier,
  OVERLAY_DEPENDENCIES,
} from './release-channel'

describe('release channel package specifier', () => {
  it('현재 stable 채널은 CLI와 Core specifier에 tag를 붙이지 않는다', () => {
    expect(CLI_PACKAGE_SPECIFIER).toBe('@lyrd/cli')
    expect(CORE_PACKAGE_SPECIFIER).toBe('@lyrd/core')
    expect(OVERLAY_DEPENDENCIES).toEqual([
      { name: '@lyrd/core', specifier: '@lyrd/core' },
      { name: '@base-ui/react', specifier: '@base-ui/react@^1.6.0' },
    ])
  })

  it('안정 버전은 태그 없이 설치한다', () => {
    expect(getPackageSpecifier('@lyrd/core', '0.1.0')).toBe('@lyrd/core')
  })

  it('다른 prerelease 채널도 같은 방식으로 전달한다', () => {
    expect(getPackageSpecifier('@lyrd/core', '0.2.0-beta.2')).toBe('@lyrd/core@beta')
  })
})
