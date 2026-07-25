# 로컬 Overlay Renderer 커스터마이징

Lyrd Core는 modal UI를 그리지 않는다. Alert·Confirm의 표시 필드, JSX, primitive, 접근성 연결과
스타일은 애플리케이션이 소유한다. CLI 생성 파일은 이 경계를 시작하기 위한 앱 코드다.

## 1. Scope에서 표시 계약 정의하기

```tsx
import { createOverlayScope } from '@lyrd/core'
import type { ReactNode } from 'react'

type AppAlertRequest = {
  title: ReactNode
  description?: ReactNode
  actionLabel?: ReactNode
}

type AppConfirmRequest = {
  title: ReactNode
  description?: ReactNode
  confirmLabel?: ReactNode
  cancelLabel?: ReactNode
  tone?: 'neutral' | 'danger'
  onCancel?: () => void
}

export const appOverlay = createOverlayScope<{
  alert: AppAlertRequest
  confirm: AppConfirmRequest
}>()

export const useOverlay = appOverlay.useOverlay
```

`title`, `tone`, label은 예시일 뿐이다. 앱은 `heading`, `body`, 아이콘이나 디자인 토큰 등 원하는
필드를 사용할 수 있다. Core는 다음 behavior 이름만 예약한다.

- Alert: `onAction`
- Confirm: `onConfirm`, `closeOnEscape`, `closeOnOutsidePress`

호출부의 `onAction`·`onConfirm`은 Core가 action 시점에 실행할 callback이다. Renderer가 받는
`action()`·`confirm()`은 Core 상태 전이를 요청하는 command이므로 `on` 접두어를 쓰지 않는다.

## 2. 관리형 Renderer 연결하기

```tsx
import type { OverlayRenderers } from '@lyrd/core'

const renderers = {
  alert: AlertSurface,
  confirm: ConfirmSurface,
} satisfies OverlayRenderers<AppOverlayRequests>

export function OverlayProvider({ children }: { children: ReactNode }) {
  return (
    <appOverlay.OverlayProvider renderers={renderers}>
      {children}
    </appOverlay.OverlayProvider>
  )
}
```

Alert Renderer는 `request`, `open`, `phase`, `action()`, `completeClose()`를 받는다. Alert는 단일
명시 action으로 닫히며 ESC와 outside close를 제공하지 않는다.

Confirm Renderer는 여기에 `confirm()`, `cancel()`, `requestClose()`, `actionStatus`, `error`를
받는다. `actionStatus === 'pending'`이면 버튼을 비활성화하고, `error`이면 실패 메시지와 재시도
action을 보여준다. Core의 `confirm()` command가 호출부 `onConfirm`의 pending·error·retry를
관리한다.

앱 전용 `onCancel`이 필요하면 Renderer에서 명시적 취소 버튼에만 연결한다.

```tsx
function handleCancel() {
  request.onCancel?.()
  cancel()
}
```

ESC, outside, programmatic close에는 이 callback을 실행하지 않는다.

## 3. UI primitive lifecycle 연결하기

Lyrd Core는 ESC나 outside press를 직접 감지하지 않는다. Base UI, Radix, shadcn 또는 자체 UI가
입력을 감지하고, 앱 Renderer가 이를 Core의 close 요청으로 바꾼다.

| 경계 | 책임 |
| --- | --- |
| UI primitive | ESC·outside 감지, focus, portal, 접근성, animation |
| 앱 Renderer adapter | UI 사건을 `requestClose()`와 `completeClose()`에 연결 |
| Lyrd Core | topmost, close option, Promise 결과, LIFO stack |

```tsx
<AlertDialog.Root
  open={open}
  onOpenChange={(nextOpen, details) => {
    if (!nextOpen) {
      requestClose(details.reason === 'escape-key' ? 'escape' : 'outside')
    }
  }}
  onOpenChangeComplete={(nextOpen) => {
    if (!nextOpen) completeClose()
  }}
/>
```

- `requestClose(reason)`: ESC·outside 시도를 Core의 topmost 판정과 정책에 전달한다.
- `completeClose()`: exit animation이 끝났고 stack에서 제거해도 됨을 알린다.
- 버튼의 `confirm()`, `cancel()`, `action()`: 이미 결정된 명시 action이다.

중첩 modal은 모두 mount되므로 backdrop과 popup의 z-index도 stack 순서에 맞게 앱이 구성해야 한다.
focus, inert, portal, `aria-hidden`은 선택한 primitive의 중첩 동작을 확인한다.

### 자체 UI를 사용하는 경우

React element라면 특정 UI 라이브러리 없이도 연결할 수 있다. 다만 자체 modal이 ESC·outside 감지,
focus trap과 복원, 배경 스크롤 방지, portal과 ARIA를 직접 구현해야 한다.

```tsx
function CustomModal() {
  const { completeClose, open, phase, requestClose } = useOverlaySession<Result>()

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') requestClose('escape')
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [requestClose])

  useEffect(() => {
    if (phase === 'closing') completeClose()
  }, [completeClose, phase])

  return open ? <AppModalContent /> : null
}
```

두 번째 effect는 exit animation이 없는 예시다. animation이 있다면 transition 완료 callback에서
`completeClose()`를 호출한다. 따라서 Lyrd는 UI agnostic이지만 adapter 연결까지 불필요한 것은
아니다.

## 4. Custom overlay 연결하기

Alert·Confirm 이외의 모달 형태는 JSX를 직접 연다.

```tsx
function ProjectSheet({ projectId }: { projectId: string }) {
  const session = useOverlaySession<{ saved: true }>()

  return (
    <Sheet
      open={session.open}
      onOpenChange={(open) => !open && session.requestClose('outside')}
      onOpenChangeComplete={(open) => !open && session.completeClose()}
    >
      <button onClick={() => session.close('cancel')}>취소</button>
      <button onClick={() => session.resolve({ saved: true })}>저장</button>
    </Sheet>
  )
}

const outcome = await overlay.open<{ saved: true }>(
  <ProjectSheet projectId={projectId} />,
)
```

JSX와 props는 호출 시점 snapshot이다. 변하는 state는 컴포넌트 내부에서 소유하고, 서버 최신값은
ID를 이용해 store나 query에서 읽는다.

## 검증 체크리스트

- Provider를 앱 root에 한 번 연결했는가
- 호출부가 같은 scope의 typed `useOverlay`를 사용하는가
- Alert가 action으로만 닫히는가
- Confirm pending 중 확인·취소·ESC·outside가 중복 실행되지 않는가
- Confirm 실패가 error로 남고 재시도할 수 있는가
- 중첩된 modal이 LIFO로 닫히며 아래 컴포넌트 state가 유지되는가
- 모든 exit 경로가 `completeClose()`를 호출하는가
- `close()`, `handle.close()`, `closeAll()`의 대상이 구분되는가
