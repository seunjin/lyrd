# Lyrd 에이전트 작업 규칙

이 파일은 저장소 전체에 적용됩니다. 하위 디렉터리에 더 구체적인 `AGENTS.md`가 있다면 해당 범위에서는 하위 규칙을 함께 따릅니다.

## 기본 원칙

- 작업은 최신 `origin/main`에서 분기한 전용 브랜치에서 진행합니다. 사용자의 로컬 `main`이 원격과 갈라져 있으면 임의로 수정하거나 덮어쓰지 않습니다.
- `main`에 직접 커밋하거나 직접 푸시하지 않습니다.
- 한 브랜치와 PR에는 하나의 명확한 목적만 담고, 관련 없는 변경을 섞지 않습니다.
- 기존 사용자 변경을 보존하고, 강제 푸시·히스토리 재작성·파괴적인 Git 명령은 명시적 승인 없이 사용하지 않습니다.
- 커밋 훅과 CI를 우회하지 않습니다. `--no-verify`를 사용하지 않습니다.

## 브랜치 네이밍 전략

브랜치명은 `<type>/<short-kebab-summary>` 형식을 사용합니다.

허용하는 `type`:

- `feat`: 사용자에게 보이는 기능 추가
- `fix`: 버그 수정
- `docs`: 문서와 문서 사이트 변경
- `refactor`: 동작을 바꾸지 않는 구조 개선
- `test`: 테스트 추가와 수정
- `build`: 빌드 시스템과 의존성 변경
- `ci`: CI·GitHub Actions 변경
- `chore`: 저장소 유지보수
- `release`: 버전·Changeset·배포 준비

규칙:

- 소문자 영문과 숫자, 하이픈만 사용합니다.
- 에이전트·도구·사람 이름을 접두어로 사용하지 않습니다. `agent/`, `codex/`, `bot/` 같은 이름은 금지합니다.
- 구현 방법보다 작업 결과가 드러나는 짧은 이름을 사용합니다.
- 브랜치는 최신 `origin/main` 커밋에서 생성합니다.

예시:

- `docs/routed-api-reference`
- `fix/overlay-dismiss-lifecycle`
- `feat/cli-toast-template`
- `ci/require-quality-gate`

## 커밋 메시지 전략

모든 커밋은 Conventional Commits 형식을 따릅니다.

```text
<type>(<scope>): <summary>
```

- 허용 type은 `feat`, `fix`, `docs`, `refactor`, `test`, `build`, `ci`, `chore`, `perf`, `revert`입니다.
- 허용 scope는 `repo`, `core`, `cli`, `storybook`, `docs`, `release`, `ci`, `overlay`, `dialog`입니다.
- 변경이 여러 영역에 걸치거나 적절한 scope가 없으면 scope를 생략할 수 있습니다.
- 헤더는 100자 이하로 작성합니다.
- summary는 변경 결과를 구체적으로 설명하고 마침표로 끝내지 않습니다.
- 에이전트나 도구 이름을 커밋 메시지에 넣지 않습니다.
- 독립적으로 이해하고 되돌릴 수 있는 단위로 커밋합니다. 포맷 변경과 기능 변경을 불필요하게 섞지 않습니다.
- 저장소의 `commitlint`와 `lefthook` 검사를 반드시 통과시킵니다.

예시:

- `docs: API 문서 라우터 구조 확장`
- `fix(core): prevent duplicate overlay dismissal`
- `ci(repo): require pull request quality checks`

## PR 전략

### 생성

- 모든 PR은 `.github/pull_request_template.md`를 원문 구조 그대로 사용합니다.
- GitHub CLI나 API로 PR을 생성할 때도 템플릿을 먼저 읽고, 모든 섹션을 채운 본문을 전달합니다. 템플릿을 생략한 임의 본문으로 대체하지 않습니다.
- PR 제목은 스쿼시 머지 후 최종 커밋 제목으로 사용할 수 있도록 `<type>(<scope>): <한국어 요약>` 형식으로 작성합니다. scope는 커밋 규칙과 동일하게 선택 사항입니다.
- PR 본문은 한국어로 작성하되 코드 식별자와 고유 기술 용어는 원문을 유지합니다.
- 기본은 draft PR입니다. 사용자가 ready PR 또는 끝까지 병합을 명시적으로 요청했거나, 사용자 승인 후 모든 준비가 끝난 경우에만 ready로 전환합니다.
- PR 생성·푸시·ready 전환·병합은 사용자가 요청한 작업 범위 안에서만 수행합니다.

### 내용

- 요약에는 문제와 결과를 1~3문장으로 설명합니다.
- 주요 변경은 검토 가능한 단위로 나눠 적습니다.
- 실행한 검증 명령과 결과를 정확히 기록합니다. 실행하지 않은 검사를 통과한 것으로 표시하지 않습니다.
- UI 변경은 대상 경로, 데스크톱·모바일 확인 결과와 필요한 스크린샷을 포함합니다.
- 공개 패키지의 API·동작·생성 결과가 바뀌면 Changeset을 추가합니다. 불필요하다면 PR에 그 이유를 적습니다.
- 위험, 호환성 영향, 후속 작업이 있다면 숨기지 않고 명시합니다.

### 품질 게이트와 병합

- ready 전에는 최소한 `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm build:storybook`, `pnpm build:docs`, `pnpm test:package`를 실행하고 결과를 템플릿에 반영합니다.
- 실패한 검사가 있으면 원인을 해결하거나 명확한 blocker로 보고합니다.
- CI가 모두 통과하고, 미해결 리뷰가 없고, 필요한 Changeset과 문서가 포함된 뒤에만 병합합니다.
- 기본 병합 방식은 squash merge입니다. 최종 스쿼시 커밋 제목은 PR 제목 규칙을 따릅니다.
- 병합 후 원격 작업 브랜치를 삭제합니다.
- npm publish와 배포 워크플로 실행은 별도의 명시적 요청 없이는 수행하지 않습니다.

