# npm 배포 가이드

Lyrd는 UI 표현을 배포하지 않고 런타임과 로컬 렌더러 생성기만 배포한다. 공개 패키지는 `@lyrd/core`, `@lyrd/cli` 두 개다.

## 버전 정책

- `@lyrd/core`의 첫 공개 버전은 `0.1.0`이다. `overlay.alert`, `overlay.confirm`, `OverlayProvider`, `useOverlay`의 공개 계약을 포함한다.
- `@lyrd/cli`의 첫 공개 버전은 `0.1.0`이다. 로컬 렌더러와 개별 Dialog 시작 파일을 생성하는 공개 계약을 포함한다.
- `0.x`에서는 breaking change도 minor 버전으로 올린다.
- CLI 템플릿이 기대하는 코어 공개 타입이나 동작이 변경되면 두 패키지에 Changeset을 작성한다.
- CSS·JSX만 바뀐 로컬 생성 템플릿의 변경도 CLI patch 버전에 포함한다.

## 배포 전 준비

1. npm에서 `@lyrd/core`, `@lyrd/cli` 스코프 패키지의 소유자 또는 maintainer 권한을 확인한다.
2. 각 패키지의 Trusted Publisher가 GitHub 저장소 `seunjin/lyrd`, 워크플로 파일 `npm-publish.yml`, 환경 `npm-publish`에 연결되어 있는지 확인한다.
3. GitHub의 `npm-publish` 환경 승인 후 `main`에서 품질 게이트가 통과한 변경만 배포한다.

배포는 장기 npm 토큰 없이 GitHub Actions OIDC로 인증되며 provenance가 자동 생성된다. Trusted Publisher의 허용 작업은 `npm publish`로 제한한다.

## GitHub Actions에서 배포 실행

`confirm`은 터미널 명령이 아니라 GitHub Actions의 수동 실행 화면에 표시되는 확인 입력란이다.

배포하기 전에 다음 상태를 확인한다.

- 배포할 버전과 CHANGELOG가 `main`에 커밋되어 있다.
- `main`의 최신 품질 게이트가 통과했다.
- `pnpm release:status`에 예상하지 않은 미적용 Changeset이 없다.
- npm에 같은 버전이 이미 게시되어 있지 않다.

GitHub 웹 화면에서는 다음 순서로 실행한다.

1. [Lyrd Actions](https://github.com/seunjin/lyrd/actions)에서 왼쪽의 **npm 배포** 워크플로를 선택한다.
2. **Run workflow**를 누르고 브랜치가 `main`인지 확인한다.
3. 확인 입력란에 정확히 `publish`를 입력한다.
4. 프리릴리스는 릴리스 채널로 `next`, 안정 릴리스는 `latest`를 선택한다. 워크플로는 선택한 채널이 Changesets 상태와 일치하는지 먼저 검사한다.
5. 초록색 **Run workflow** 버튼을 눌러 실행한다.
6. 작업이 `npm-publish` 환경에서 대기하면 **Review deployments**를 선택한다.
7. `npm-publish` 환경을 체크하고 **Approve and deploy**를 누른다.
8. 품질 검증, **릴리스 채널 확인**, **npm에 공개 배포**, **npm dist-tag 검증** 단계가 모두 성공했는지 확인한다.
9. npm 패키지 페이지에서 버전, dist-tag와 provenance를 확인한다.

`publish`는 오입력을 막는 안전장치이며 버전이나 npm 태그가 아니다. 실제 버전과 `next` 또는 `latest` 태그는 커밋된 package.json과 Changesets 프리릴리스 상태로 결정된다. 환경 승인 전에는 npm publish가 실행되지 않는다.

Changesets 프리릴리스 모드에서는 `changeset publish --tag next`를 직접 사용할 수 없다. 워크플로는 `next`를 선택하면 프리릴리스 상태와 태그를 검증한 뒤 인자 없는 `changeset publish`를 실행하고, Changesets가 `next` dist-tag를 적용하도록 맡긴다. `latest`는 `.changeset/pre.json`이 `exit` 상태일 때만 허용한다.

터미널에서 GitHub CLI로 같은 워크플로를 시작할 수도 있다.

```bash
gh workflow run npm-publish.yml \
  --ref main \
  -f confirm=publish \
  -f tag=next
```

터미널에서 시작하더라도 `npm-publish` 환경 승인은 GitHub Actions 화면에서 수행한다. 로컬의 `pnpm release`는 npm에 직접 publish를 시도하므로 일반 배포에는 사용하지 않는다.

## 첫 프리릴리스 절차

1. 공개 변경이 있는 PR에서 `pnpm changeset`을 실행해 Changeset을 추가한다.
2. 첫 후보 배포를 준비할 때 `pnpm exec changeset pre enter next`로 프리릴리스 모드에 진입한다.
3. `pnpm version-packages`를 실행하고 생성된 `0.x.y-next.n` 버전·CHANGELOG 변경을 검토해 `main`에 반영한다.
4. GitHub Actions의 **npm 배포** 워크플로를 `main`에서 실행한다. 확인 입력값으로 `publish`를 입력한다.
5. 환경 승인 후 워크플로가 전체 검증과 `changeset publish`를 실행한다. 프리릴리스 모드에서는 npm의 `next` dist-tag로 게시된다.
6. npm 패키지 페이지에서 버전과 provenance를 확인한다.

Changesets와 npm은 안정 버전 이력이 없는 최초 프리릴리스를 `latest`에도 연결하며, 유일한 공개 버전의 `latest` 태그는 제거할 수 없다. 따라서 첫 후보는 `latest`와 `next`에 함께 연결되고, 첫 안정 버전을 배포하면 `latest`가 안정 버전으로 이동한다.

후속 후보 변경에는 새 Changeset을 추가하고 `pnpm version-packages`를 다시 실행해 `next.1`, `next.2`로 올린다.

## 안정 버전 전환

1. 후보 검증이 끝나면 `pnpm exec changeset pre exit`를 실행한다.
2. `pnpm version-packages`로 안정 버전을 생성하고 변경을 검토한다.
3. 동일한 수동 워크플로와 환경 승인을 거쳐 `latest`로 배포한다.

`pnpm release`는 로컬에서 즉시 publish를 시도하므로 일상 릴리스 절차로 사용하지 않는다. npm 배포 의사를 명시적으로 확인한 경우에만 사용한다.
