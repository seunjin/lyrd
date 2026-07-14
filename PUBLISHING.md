# npm 배포 가이드

Lyrd는 UI 표현을 배포하지 않고 런타임과 로컬 렌더러 생성기만 배포한다. 공개 패키지는 `@lyrd/core`, `@lyrd/cli` 두 개다.

## 버전 정책

- `@lyrd/core`의 첫 공개 버전은 `0.1.0`이다. `overlay.alert`, `overlay.confirm`, `OverlayProvider`, `useOverlay`의 공개 계약을 포함한다.
- `@lyrd/cli`의 첫 공개 버전은 `0.1.0`이다. 로컬 렌더러와 개별 Dialog 시작 파일을 생성하는 공개 계약을 포함한다.
- `0.x`에서는 breaking change도 minor 버전으로 올린다.
- CLI 템플릿이 기대하는 코어 공개 타입이나 동작이 변경되면 두 패키지에 Changeset을 작성한다.
- CSS·JSX만 바뀐 로컬 생성 템플릿의 변경도 CLI patch 버전에 포함한다.

## 첫 배포 전 준비

1. npm에서 `@lyrd/core`, `@lyrd/cli` 스코프 패키지의 소유자 또는 maintainer 권한을 확인한다.
2. npm에서 publish 권한이 있는 granular access token을 만들고 GitHub Actions secret `NPM_TOKEN`에 등록한다. 이 토큰은 패키지 페이지가 아직 없는 첫 배포에서만 사용한다.
3. GitHub 저장소 Settings → Environments에 `npm-publish` 환경을 만들고 배포 승인자를 지정한다.
4. `main`에서 품질 게이트가 통과한 변경만 배포한다.

첫 배포가 끝나 패키지 페이지가 생성되면 각 패키지의 npm Trusted Publishing에 GitHub 저장소 `seunjin/lyrd`, 워크플로 파일 `npm-publish.yml`, 환경 `npm-publish`를 등록한다. 허용 작업은 `npm publish`다. 연결을 확인한 뒤 `NPM_TOKEN` secret을 삭제한다. 이후 배포는 GitHub Actions OIDC로 인증되며 provenance가 자동 생성된다.

## 첫 프리릴리스 절차

1. 공개 변경이 있는 PR에서 `pnpm changeset`을 실행해 Changeset을 추가한다.
2. 첫 후보 배포를 준비할 때 `pnpm exec changeset pre enter next`로 프리릴리스 모드에 진입한다.
3. `pnpm version-packages`를 실행하고 생성된 `0.x.y-next.n` 버전·CHANGELOG 변경을 검토해 `main`에 반영한다.
4. GitHub Actions의 **npm 배포** 워크플로를 `main`에서 실행한다. 확인 입력값으로 `publish`를 입력한다. 최초 실행에서만 인증 방식으로 `bootstrap-token`을 선택한다.
5. 환경 승인 후 워크플로가 전체 검증과 `changeset publish`를 실행한다. 프리릴리스 모드에서는 npm의 `next` dist-tag로 게시된다.
6. npm 패키지 페이지에서 버전과 provenance를 확인한다.
7. 두 패키지에 Trusted Publisher를 등록하고 다음 배포부터 인증 방식 `trusted-publishing`을 사용한다.

Changesets와 npm은 안정 버전 이력이 없는 최초 프리릴리스를 `latest`에 연결하며, 유일한 공개 버전의 `latest` 태그는 제거할 수 없다. 배포 워크플로는 게시 직후 패키지를 public으로 확정하고 `next` 태그도 명시적으로 추가한다. 따라서 첫 후보는 `latest`와 `next`에 함께 연결되고, 첫 안정 버전을 배포하면 `latest`가 안정 버전으로 이동한다. 게시 자체는 성공했지만 이 후처리만 다시 실행해야 할 때는 작업으로 `finalize-prerelease`를 선택한다.

후속 후보 변경에는 새 Changeset을 추가하고 `pnpm version-packages`를 다시 실행해 `next.1`, `next.2`로 올린다.

## 안정 버전 전환

1. 후보 검증이 끝나면 `pnpm exec changeset pre exit`를 실행한다.
2. `pnpm version-packages`로 안정 버전을 생성하고 변경을 검토한다.
3. 동일한 수동 워크플로와 환경 승인을 거쳐 `latest`로 배포한다.

`pnpm release`는 로컬에서 즉시 publish를 시도하므로 일상 릴리스 절차로 사용하지 않는다. npm 배포 의사를 명시적으로 확인한 경우에만 사용한다.
