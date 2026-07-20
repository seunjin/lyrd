# 소비 앱 회귀 검증

이 디렉터리는 Lyrd workspace linking을 사용하지 않고, 실제 패키지 소비 환경에서 Vite +
React와 Next.js App Router를 검증한다. `fixtures/`는 루트 `pnpm-workspace.yaml`의 `apps/*`,
`packages/*` 범위 밖에 있으며 실행할 때마다 임시 디렉터리로 복사된다.

## 모드

- `pnpm test:consumer`: `@lyrd/core`와 `@lyrd/cli`를 현재 소스에서 빌드하고 `pnpm pack`한
  tarball을 설치한다. 미배포 변경을 포함하므로 PR 품질 게이트에서 사용한다.
- `pnpm test:consumer:registry`: npm의 `@lyrd/core@next`, `@lyrd/cli@next`를 설치한다. 현재
  dist-tag와 실제 배포물 확인용이며 미배포 변경의 PR 게이트로 사용하지 않는다.

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
