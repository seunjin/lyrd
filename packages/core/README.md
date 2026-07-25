# @lyrd/core

제품의 Alert, Confirm과 커스텀 modal overlay 세션을 관리하는 Lyrd의 React 런타임이다.

Lyrd는 Dialog 같은 UI primitive나 스타일을 제공하지 않는다. 애플리케이션이 표시 request와
renderer를 정의하며, Core는 LIFO stack, Promise 결과와 닫힘 lifecycle을 관리한다.

ESC와 outside press는 Base UI, Radix 또는 자체 UI가 감지한다. 앱 renderer가 이를
`requestClose()`로 전달하면 Core가 topmost와 close option을 확인한다. focus, portal, 접근성과
exit animation은 UI가 담당하고, animation 완료는 `completeClose()`로 Core에 알린다.

## 설치

로컬 Base UI 렌더러와 함께 설치하려면 CLI를 사용한다.

```bash
pnpm dlx @lyrd/cli add overlay
```

런타임만 직접 설치할 수도 있다.

```bash
pnpm add @lyrd/core
```

## Scope 만들기

애플리케이션이 사용할 표시 필드를 정의하고 scope를 한 번 만든다. `onAction`, `onConfirm`과
Confirm의 close 정책은 Core가 관리하는 예약 behavior다.

```tsx
import { createOverlayScope } from '@lyrd/core'
import type { ReactNode } from 'react'

export const appOverlay = createOverlayScope<{
  alert: { message: ReactNode; actionLabel?: ReactNode }
  confirm: { heading: ReactNode; body?: ReactNode; primaryAction?: ReactNode }
}>()
```

scope의 `OverlayProvider`에 앱이 소유한 Alert와 Confirm renderer를 전달한다. Renderer는 UI
primitive의 open 상태와 exit 완료를 각각 `open`, `completeClose()`에 연결한다.

```tsx
<appOverlay.OverlayProvider
  renderers={{
    alert: AppAlertRenderer,
    confirm: AppConfirmRenderer,
  }}
>
  {children}
</appOverlay.OverlayProvider>
```

## Overlay 열고 닫기

`alert()`는 `void`, `confirm()`은 `boolean`을 반환한다. Confirm에 `onConfirm`을 전달하면 Core가
동기·비동기 작업의 pending, error와 retry 상태를 관리한다.

```tsx
await overlay.alert({ message: '저장했습니다.' })

const confirmed = await overlay.confirm({
  heading: '삭제할까요?',
  onConfirm: () => deleteProject(),
})
```

Dialog, Sheet, BottomSheet 등 커스텀 UI는 JSX를 `open()`에 직접 전달한다. 전달한 JSX와 props는
호출 시점의 snapshot이며, 열린 컴포넌트 안에서는 `useOverlaySession<Result>()`로 결과와 닫힘을
제어한다.

```tsx
const outcome = await overlay.open<{ saved: true }>(<ProjectEditor projectId="project-1" />)
```

`overlay.close()`는 stack의 topmost 세션을, `handle.close()`는 정확한 세션을 닫는다.
`overlay.closeAll('route-change')`은 같은 client의 모든 세션을 정리한다. 세션은
`completeClose()`가 호출될 때까지 closing 상태로 mount를 유지한다.

사용법과 인터랙티브 데모는 [Lyrd 문서](https://seunjin.github.io/lyrd/)에서 확인할 수 있다.
