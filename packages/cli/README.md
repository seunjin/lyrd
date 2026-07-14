# @lyrd/cli

Lyrd이 관리하는 상태와 애플리케이션이 소유하는 로컬 UI 연결 코드를 생성하는 CLI다.

## 오버레이 설치

```bash
pnpm dlx @lyrd/cli add overlay
```

이 명령은 다음 작업을 수행한다.

- `@lyrd/core`와 `@base-ui/react`를 애플리케이션 의존성으로 설치한다.
- `src/lyrd/overlay`에 `alert.tsx`, `confirm.tsx`, `overlay-provider.tsx`, `overlay.css`를 생성한다.
- 기존 파일은 덮어쓰지 않는다.
- Vite에서는 실제 `src/main.tsx` 또는 `src/main.jsx` 파일에 `AppOverlayProvider`를 연결하는 코드를 안내한다.
- Next App Router에서는 `app/lyrd-overlay-provider.tsx`(또는 `src/app/...`) 클라이언트 연결 파일을 만들고, `layout.tsx`에 추가할 코드를 안내한다.
- 기존 진입점과 Provider 파일은 덮어쓰거나 자동 수정하지 않는다.

전체 연결 예제가 필요하면 `--verbose`를 사용한다.

```bash
pnpm dlx @lyrd/cli add overlay --verbose
```

첫 번째 `add` 명령은 `lyrd.json`이 없으면 자동으로 생성한다. `paths.overlay`는 오버레이 로컬 파일 경로이며, `adapters.overlay`는 생성 템플릿이 사용하는 기반 프리미티브를 기록한다.

vNext CLI는 이전 `dialog`, `toast`, `drawer` 생성 명령과 호환되지 않는다. 이전 구현은 Git 태그와 릴리스에서만 유지하며 새 CLI에는 호환 계층을 두지 않는다.

## 개별 Dialog 생성

먼저 `lyrd add overlay`로 Provider를 설치한 뒤 앱 소유의 Dialog 파일을 추가한다.

```bash
pnpm dlx @lyrd/cli add dialog project-settings
```

다음 파일을 생성한다.

```text
src/lyrd/overlay/dialogs/
  project-settings-dialog.tsx
  dialog.css
  index.ts
```

이름은 kebab-case만 허용한다. 생성 컴포넌트는 Base UI Dialog와 `useOverlayDialog()`의 닫힘·결과 계약을 연결한 시작점이며, 모달·Drawer·풀페이지 등 앱이 원하는 형태로 자유롭게 수정할 수 있다. 기존 컴포넌트와 공유 스타일은 덮어쓰지 않는다.
