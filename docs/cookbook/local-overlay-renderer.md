# 로컬 오버레이 렌더러 커스터마이징

Lyrd는 오버레이의 상태, 결과, 대기열, 중복 방지를 관리한다. 화면의 JSX, CSS, 버튼, 문구 배치와 접근성 프리미티브 선택은 애플리케이션이 소유한다.

`lyrd add overlay`가 만드는 파일은 시작점일 뿐이다. 앱의 디자인 시스템이나 기존 확인창으로 자유롭게 바꿀 수 있다. 단, Lyrd가 제공하는 렌더러 props와 닫힘 생명주기만 유지한다.

## 생성 파일과 소유권

```text
src/overlays/
  OverlayProvider.tsx
  alert/
    AlertSurface.tsx    # 안내 오버레이 화면
    Alert.module.css    # CSS Modules 선택 시 시작 스타일
  confirm/
    ConfirmSurface.tsx  # 확인 오버레이 화면
    Confirm.module.css  # CSS Modules 선택 시 시작 스타일
```

이 파일들은 모두 앱 코드다. CLI는 기존 파일을 덮어쓰지 않으며, Lyrd 패키지 업데이트도 이 파일을 수정하지 않는다.

| 책임 | 소유자 |
| --- | --- |
| 요청, Promise 결과, 대기열, `dedupeKey`, pending/error 상태 | `@lyrd/core` |
| 포커스, 포털, ESC·바깥 클릭 같은 프리미티브 동작 | Base UI, Radix 등 선택한 UI 기반 라이브러리 |
| JSX, CSS, 버튼, 아이콘, 오류 문구, 디자인 토큰 | 애플리케이션 |

## Provider를 한 번 연결하기

`OverlayProvider`는 앱 루트에서 한 번만 렌더링한다. 생성 직후 CLI가 프로젝트에 맞는 정확한 import 경로와 코드를 출력한다.

Vite에서는 `src/main.tsx` 또는 `src/main.jsx`의 기존 앱을 감싼다.

```tsx
import { OverlayProvider } from './overlays/OverlayProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OverlayProvider>
      <App />
    </OverlayProvider>
  </StrictMode>,
)
```

Next App Router에서는 CLI가 `app/lyrd-overlay-provider.tsx` 또는 `src/app/lyrd-overlay-provider.tsx`를 만든다. `layout.tsx`는 앱이 직접 다음처럼 연결한다.

```tsx
import { LyrdOverlayProvider } from './lyrd-overlay-provider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <LyrdOverlayProvider>{children}</LyrdOverlayProvider>
      </body>
    </html>
  )
}
```

CLI는 기존 `main`과 `layout` 파일을 자동 수정하지 않는다. 앱의 Provider 순서, 서버/클라이언트 경계, 기존 인증·테마 Provider 구조를 애플리케이션이 결정해야 하기 때문이다.

## 디자인 시스템 버튼으로 바꾸기

생성된 `confirm.tsx`의 일반 `button`을 팀의 Button 컴포넌트로 교체해도 된다. `confirm`, `cancel`, `status`를 그대로 연결한다.

```tsx
import { Button } from '@/components/ui/button'
import type { ConfirmSurfaceProps } from '@lyrd/core'

export function ConfirmSurface({ cancel, confirm, request, status }: ConfirmSurfaceProps) {
  if (!request) return null

  const pending = status === 'pending'

  return (
    <footer>
      <Button disabled={pending} onClick={cancel} variant="secondary">
        {request.cancelLabel ?? '취소'}
      </Button>
      <Button
        aria-busy={pending}
        disabled={pending}
        onClick={confirm}
        variant={request.tone === 'danger' ? 'destructive' : 'primary'}
      >
        {pending ? '처리 중…' : request.confirmLabel}
      </Button>
    </footer>
  )
}
```

`tone`은 스타일 선택을 위한 힌트다. `danger`일 때 어떤 색과 강조를 쓸지는 앱이 정한다.

## 비동기 확인의 pending과 error

호출부에서 `onConfirm`을 전달하면 Lyrd가 실행 상태를 관리한다.

```tsx
await overlay.confirm({
  title: '프로젝트를 삭제할까요?',
  confirmLabel: '삭제',
  tone: 'danger',
  onConfirm: () => deleteProject(projectId),
})
```

렌더러는 `status === 'pending'`일 때 진행 표현과 버튼 비활성화를 결정한다. pending 중에는 Lyrd가 취소, ESC, 바깥 클릭에 의한 닫힘을 막는다. 렌더러가 별도의 Promise 상태를 만들거나 성공 시 직접 닫을 필요가 없다.

```tsx
const pending = status === 'pending'

<Button aria-busy={pending} disabled={pending} onClick={confirm}>
  {pending ? <Spinner aria-label="삭제 중" /> : request.confirmLabel}
</Button>
```

실패하면 `status`는 `error`가 되고 `error` 값이 전달된다. 오류 객체를 그대로 화면에 출력하지 말고, 앱의 안전한 사용자 문구로 바꿔 보여 준다. 사용자가 다시 확인하면 같은 `onConfirm`이 재시도된다.

```tsx
{status === 'error' ? (
  <p role="alert">작업을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
) : null}
```

## 기존 확인창에 연결하기

이미 팀이 소유한 확인창이 있다면 생성된 `confirm.tsx`를 그 컴포넌트의 얇은 연결 코드로 바꾼다. Base UI를 쓸 필요는 없다.

```tsx
import type { ConfirmSurfaceProps } from '@lyrd/core'
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog'

export function ConfirmSurface(props: ConfirmSurfaceProps) {
  const { cancel, completeExit, confirm, error, open, request, requestDismiss, status } = props

  return (
    <DeleteConfirmDialog
      errorMessage={status === 'error' ? '작업을 완료하지 못했습니다.' : undefined}
      onConfirm={confirm}
      onOpenChange={(nextOpen) => !nextOpen && requestDismiss()}
      onOpenChangeComplete={(nextOpen) => !nextOpen && completeExit()}
      onCancel={cancel}
      open={open}
      pending={status === 'pending'}
      title={request?.title}
    />
  )
}
```

`completeExit`은 닫힘 애니메이션이 끝났을 때 한 번 호출한다. 이를 생략하면 다음 대기 요청으로 넘어가지 않을 수 있다. 애니메이션이 없다면 UI 기반 라이브러리의 닫힘 완료 콜백에서 즉시 호출하면 된다. 개발 모드에서 closing 상태가 10초 이상 지속되면 Lyrd가 이 연결 누락 가능성을 경고하며, 런타임이 세션을 강제로 종료하지는 않는다.

## 유지해야 하는 연결 계약

다음 동작은 렌더러를 교체해도 유지한다.

- `confirm()`은 확인 버튼에서만 호출한다.
- `cancel()`은 취소 버튼에서 호출한다.
- ESC나 바깥 클릭처럼 사용자가 dismiss를 시도한 경우 `requestDismiss()`를 호출한다.
- 실제 닫힘 애니메이션이 끝나면 `completeExit()`을 호출한다.
- `open`, `request`, `status`, `error`는 Lyrd가 제공한 값을 그대로 화면에 반영한다.

`requestDismiss()`가 pending 중인 dismiss를 거절하는 정책은 Lyrd 코어가 관리한다. 렌더러는 이 정책을 재구현하지 않는다.

## 호출부는 의도만 표현하기

호출부는 특정 Dialog 컴포넌트를 import하거나 열림 상태를 관리하지 않는다.

```tsx
const overlay = useOverlay()

const confirmed = await overlay.confirm({
  title: '초안을 삭제할까요?',
  description: '삭제한 초안은 복구할 수 없습니다.',
  confirmLabel: '삭제',
  cancelLabel: '계속 작성',
  tone: 'danger',
})

if (confirmed) {
  await deleteDraft()
}
```

이 분리를 유지하면 Base UI에서 Radix 또는 팀의 커스텀 UI로 렌더러를 바꿔도 호출부와 `overlay.*` 공개 API는 유지된다.
