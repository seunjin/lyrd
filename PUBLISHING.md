# npm 배포 가이드

Lyrd는 UI 표현을 배포하지 않고 런타임과 로컬 렌더러 생성기만 배포한다. 공개 패키지는 `@lyrd/core`, `@lyrd/cli` 두 개다.

## 버전 정책

- `@lyrd/core`의 첫 공개 버전은 `0.1.0`이다. `overlay.alert`, `overlay.confirm`, `OverlayProvider`, `useOverlay`의 공개 계약을 포함한다.
- `@lyrd/cli`의 기준 버전은 현재 `0.2.0`이다.
- `0.x`에서는 breaking change도 minor 버전으로 올린다.
- CLI 템플릿이 기대하는 코어 공개 타입이나 동작이 변경되면 두 패키지에 Changeset을 작성한다.
- CSS·JSX만 바뀐 로컬 생성 템플릿의 변경도 CLI patch 버전에 포함한다.

## 배포 전 준비

1. npm에서 `@lyrd/core`, `@lyrd/cli` 스코프 패키지의 소유자 또는 maintainer 권한을 확인한다.
2. 각 패키지의 npm Trusted Publishing에 GitHub 저장소 `seunjin/lyrd`, 워크플로 `.github/workflows/npm-publish.yml`, 환경 `npm-publish`를 등록한다.
3. GitHub 저장소 Settings → Environments에 `npm-publish` 환경을 만들고 배포 승인자를 지정한다.
4. `main`에서 품질 게이트가 통과한 변경만 배포한다.

Trusted Publishing은 npm 토큰을 GitHub Secrets에 저장하지 않고 GitHub Actions OIDC로 provenance가 포함된 배포를 수행한다.

## 릴리스 절차

1. 공개 변경이 있는 PR에서 `pnpm changeset`을 실행해 Changeset을 추가한다.
2. 배포할 때 `pnpm version`을 실행하고 생성된 버전·CHANGELOG 변경을 검토해 `main`에 반영한다.
3. GitHub Actions의 **npm 배포** 워크플로를 `main`에서 실행한다. 확인 입력값으로 `publish`를 입력한다.
4. 환경 승인 후 워크플로가 전체 검증과 `changeset publish`를 실행한다.
5. npm 패키지 페이지에서 버전과 provenance를 확인하고, 빈 Changeset을 정리하는 후속 PR을 만든다.

`pnpm release`는 로컬에서 즉시 publish를 시도하므로 일상 릴리스 절차로 사용하지 않는다. npm 배포 의사를 명시적으로 확인한 경우에만 사용한다.
