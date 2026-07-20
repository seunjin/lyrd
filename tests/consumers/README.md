# 소비 앱 회귀 검증

이 디렉터리는 Lyrd workspace linking을 사용하지 않고, 실제 패키지 소비 환경에서 Vite +
React와 Next.js App Router를 검증한다. `fixtures/`는 루트 `pnpm-workspace.yaml`의 `apps/*`,
`packages/*` 범위 밖에 있으며 실행할 때마다 임시 디렉터리로 복사된다.

## 모드

- `pnpm test:consumer`: `@lyrd/core`와 `@lyrd/cli`를 현재 소스에서 빌드하고 `pnpm pack`한
  tarball을 설치한다. 미배포 변경을 포함하므로 PR 품질 게이트에서 사용한다.
- `pnpm test:consumer:registry`: npm의 `next` dist-tag가 가리키는 정확한 버전을 먼저 조회하고
  `@lyrd/core@next`, `@lyrd/cli@next`의 실제 설치 버전이 일치하는지 검증한다.
- `pnpm test:consumer:registry:latest`: 같은 검증을 npm의 `latest` dist-tag에 수행한다. runner를
  직접 실행할 때는 registry 모드에서 `--tag next` 또는 `--tag latest`를 선택할 수 있다.

registry 모드는 실제 배포물 확인용이며 미배포 변경의 PR 게이트로 사용하지 않는다. pnpm 11은
`minimumReleaseAge` 기본값이 1440분이므로 배포 직후 dist-tag가 최신 버전을 가리켜도 이전 버전을
선택할 수 있다. 두 fixture는 supply-chain 보호를 전체 해제하지 않고 `minimumReleaseAgeExclude`에
`@lyrd/core`, `@lyrd/cli`만 지정해 새 Lyrd 배포물을 즉시 검증한다. 조회한 dist-tag 버전과 Vite,
Next.js fixture에 실제 설치된 버전이 다르면 build 전에 실패한다.

두 모드 모두 깨끗한 `pnpm install`, 실제 CLI의 overlay/dialog/toast 생성, TypeScript 검사,
production build와 Chromium 상호작용을 순서대로 실행하고 임시 디렉터리를 정리한다.

## 고정된 소비 환경

- Vite `8.1.5`, `@vitejs/plugin-react` `6.0.3`
- Next.js `16.2.10` App Router
- React / React DOM `19.2.7`
- Base UI `1.6.0`, TypeScript `6.0.2`
- Playwright `1.61.1`

버전을 올릴 때는 local과 registry 모드를 모두 실행해 프레임워크 build와 browser runtime 결과를
함께 확인한다.
