# Lyrd

[문서와 인터랙티브 데모](https://seunjin.github.io/lyrd/) · [LLM 가이드](https://seunjin.github.io/lyrd/llms.txt) · [GitHub](https://github.com/seunjin/lyrd)

애플리케이션이 소유한 modal UI와 제품 코드 사이에서 요청, Promise 결과와 LIFO stack을 관리하는
React 라이브러리다.

Lyrd는 Dialog, Sheet, BottomSheet 같은 UI primitive나 스타일을 제공하지 않는다. 자주 쓰는
Alert·Confirm UX만 관리형 recipe로 제공하고, 나머지 modal interaction은 JSX를 직접 연다.

## 현재 기능

- 앱 request 타입과 Renderer를 묶는 `createOverlayScope()`
- 단일 action을 제공하는 `overlay.alert()`
- 동기·비동기 `onConfirm`, pending·error·retry를 관리하는 `overlay.confirm()`
- 임의 JSX를 여는 `overlay.open(<Component />)`
- resolved value와 close reason을 구분하는 `OverlayOutcome`
- 새 세션이 위에 쌓이고 마지막 세션부터 닫히는 LIFO stack
- topmost `overlay.close()`, 정확한 `handle.close()`, 전체 `overlay.closeAll()`
- exit animation이 끝날 때까지 mount를 유지하는 close lifecycle
- 앱이 직접 소유하고 수정하는 Base UI Renderer 생성 CLI

Toast와 non-modal notification은 Core 범위가 아니다.

## 설치

```bash
pnpm dlx @lyrd/cli init
pnpm dlx @lyrd/cli add overlay
```

CLI는 `scope.ts`, `OverlayProvider.tsx`, Alert·Confirm Renderer와 선택한 스타일 파일을 앱 안에
생성한다. 기존 파일이나 앱 진입점은 덮어쓰지 않는다.

```text
src/overlays/
  scope.ts
  OverlayProvider.tsx
  alert/AlertSurface.tsx
  confirm/ConfirmSurface.tsx
```

생성된 Provider를 앱 root에 한 번 연결한 뒤, 같은 scope의 `useOverlay`를 사용한다. 자세한 연결은
[로컬 Renderer Cookbook](docs/cookbook/local-overlay-renderer.md)을 참고한다.

## Alert와 Confirm

표시 필드는 앱이 직접 정의한다. 아래 `title`, `tone`, label은 Lyrd가 강제하는 필드가 아니라 이
저장소 예제 scope의 필드다.

```tsx
const overlay = useOverlay()

await overlay.alert({
  title: '저장했습니다.',
  actionLabel: '확인',
  onAction: () => trackSavedNotice(),
})

const confirmed = await overlay.confirm({
  title: '프로젝트를 삭제할까요?',
  description: '삭제한 프로젝트는 복구할 수 없습니다.',
  confirmLabel: '삭제',
  cancelLabel: '취소',
  tone: 'danger',
  onConfirm: () => deleteProject(),
})
```

호출부의 `onAction`과 `onConfirm`은 Core가 action 시점에 실행하는 callback이다. Renderer는 각각
`action()`과 `confirm()` command를 받는다. Confirm 작업이 실패하면 열린 상태로 error를 표시하고
같은 command로 재시도한다.

## Custom overlay

Dialog, Sheet, BottomSheet, Drawer와 fullscreen modal은 모두 JSX를 `open()`에 전달한다.

```tsx
type ProjectResult = { name: string }

function ProjectEditor({ projectId }: { projectId: string }) {
  const session = useOverlaySession<ProjectResult>()

  return (
    <Dialog.Root
      open={session.open}
      onOpenChange={(open, details) => {
        if (!open) {
          session.requestClose(details.reason === 'escape-key' ? 'escape' : 'outside')
        }
      }}
      onOpenChangeComplete={(open) => !open && session.completeClose()}
    >
      <button onClick={() => session.close('cancel')}>취소</button>
      <button onClick={() => session.resolve({ name: 'Lyrd' })}>저장</button>
    </Dialog.Root>
  )
}

const outcome = await overlay.open<ProjectResult>(
  <ProjectEditor projectId={projectId} />,
)
```

`open()`에 전달한 JSX와 props는 호출 시점의 snapshot이다. 변하는 폼·step·loading state는 열린
컴포넌트 안에서 관리하고, 외부 최신 데이터가 필요하면 안정적인 ID로 store나 query를 구독한다.

`open()`의 반환값은 awaitable `OverlayHandle`이다. `handle.close()`는 정확한 세션을,
`overlay.close()`는 stack의 topmost 세션을 닫는다. `overlay.closeAll('route-change')`은 현재
client의 모든 세션을 닫는다.

## 패키지

| 패키지 | 역할 |
| --- | --- |
| `@lyrd/core` | Alert, Confirm, custom modal session과 LIFO stack |
| `@lyrd/cli` | 앱 소유 scope, Base UI Renderer와 Dialog 시작점 생성 |

## 개발

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm build:storybook
pnpm build:docs
pnpm test:package
```

설계 기준은 [최소 modal overlay stack RFC](docs/rfcs/0004-minimal-modal-overlay-stack.md), 이전
prerelease API에서 이동하는 방법은 [0.2 Overlay API migration](docs/migrations/0.2-overlay-api.md)에
기록한다.

## 라이선스

MIT
