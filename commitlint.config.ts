import type { UserConfig } from '@commitlint/types'

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'refactor', 'test', 'build', 'ci', 'chore', 'perf', 'revert'],
    ],
    'scope-enum': [
      2,
      'always',
      ['repo', 'core', 'cli', 'storybook', 'docs', 'release', 'ci', 'overlay', 'dialog'],
    ],
    'header-max-length': [2, 'always', 100],
  },
}

export default config
