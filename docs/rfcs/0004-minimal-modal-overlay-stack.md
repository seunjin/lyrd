# RFC 0004: 최소 Modal Overlay Stack API

- 상태: 승인·구현 완료·역사적 설계 기준
- 작성일: 2026-07-25
- 담당: Lyrd 유지보수 팀
- 선행 RFC:
  - [RFC 0001: Lyrd 오버레이 의도 관리 시스템](0001-overlay-intent-system.md)
  - [RFC 0002: 범용 Dialog 세션 계약](0002-registered-overlay-contract.md)
  - [RFC 0003: 오버레이 정의와 정책 계층 분리](0003-overlay-definition-and-policy-layers.md)

> [!IMPORTANT]
> 이 문서는 0.2 API를 결정한 설계 기록이며 현재 사용법과 정확한 공개 타입의 기준이 아니다. 실제
> 사용법은 [Lyrd 문서 앱](https://seunjin.github.io/lyrd/), 공개 계약은
> [`packages/core/src/index.ts`](../../packages/core/src/index.ts)를 확인한다.

## 요약

Lyrd의 공개 범위를 **modal interaction의 실행과 결과 및 닫힘 수명주기 관리**로 줄인다.

`alert()`와 `confirm()`은 공통 UX를 제공하는 제품 레시피로 유지하고, Dialog, Sheet,
Bottom Sheet, Drawer, Fullscreen Modal처럼 애플리케이션이 소유하는 커스텀 UI는 모두
`open(element)`로 연다.

Core는 alert와 confirm의 표시 필드 이름을 정하지 않는다. 애플리케이션은 typed overlay scope를
만들 때 alert와 confirm request 필드를 정의한다. Core는 Alert의 동기 `onAction`, Confirm의
동기·비동기 `onConfirm`과 close 정책처럼 실제 상태 전이에 필요한 행동 필드만 예약한다.

오버레이를 열 때 전달한 React element와 props는 생성 시점의 불변 입력으로 취급한다.
열린 뒤 변경되는 상태는 오버레이 컴포넌트가 직접 소유하거나, 안정적인 ID를 입력으로 받아
애플리케이션의 store, query, context 또는 observable을 구독한다. Lyrd는 열린 element의 props를
외부 호출부와 계속 동기화하지 않는다.

중첩된 modal overlay는 마지막에 열린 UI가 먼저 닫히는 LIFO stack으로 관리한다. 공개 명령은
`open`, `close`, `closeAll` 용어로 통일하고 `dismiss`, `dismissAll` 용어는 제거한다.

## 제품 정의

> Lyrd는 `alert`, `confirm`과 애플리케이션이 만든 커스텀 modal overlay를 열고,
> 결과·중첩 순서·close 정책·닫힘 수명주기를 관리한다.

Lyrd가 책임지는 영역은 다음과 같다.

- `alert`, `confirm`의 제품 의도와 안전한 기본 동작
- 커스텀 React element의 명령형 실행
- 호출별 Promise 결과와 정확한 세션 Handle
- 중첩 modal overlay의 LIFO stack
- ESC와 outside press 같은 close 요청 정책
- 실제 닫힘 애니메이션 완료 신호에 연결되는 수명주기
- 전체 오버레이를 닫는 route change 및 programmatic 제어
- Provider와 client 인스턴스 단위의 격리

Lyrd가 책임지지 않는 영역은 다음과 같다.

- Dialog, Sheet, Drawer의 DOM, 스타일, 포털, focus trap 및 접근성 구현
- 열린 element의 props를 외부 호출부와 동기화하는 상태 관리
- 데이터 fetching, mutation, progress 및 form 상태
- Toast의 timeout, swipe, live region 및 stack
- 범용 queue, group, parallel, replace, priority 전략
- React element 종류에 따른 자동 분류 또는 registry

## 제공하는 UX와 선택 기준

Lyrd의 세 가지 실행 API는 지원하는 사용자 경험을 의도적으로 제한한다.

| API | 적합한 상황 | 결과 | Core가 관리하는 작업 | 범위를 벗어나는 상황 |
| --- | --- | --- | --- | --- |
| `alert()` | 내용을 알리고 하나의 버튼으로 닫기 | `void` | 동기 `onAction` | 비동기 작업, 여러 선택지, 입력 |
| `confirm()` | 확인 또는 취소의 두 가지 결정 | `boolean` | 동기·비동기 `onConfirm`, pending, error, retry | 세 가지 이상 선택, 입력, custom result |
| `open()` | 앱이 만든 임의의 modal interaction | `OverlayOutcome<Result>` | 없음 | Toast와 non-modal notification |

선택 기준은 다음과 같다.

- 단순 안내와 닫기라면 `alert()`를 사용한다.
- 사용자가 진행 여부를 결정한다면 `confirm()`을 사용한다.
- 입력, 여러 행동, custom result 또는 앱 고유 상태 흐름이 필요하면 `open()`을 사용한다.
- timeout, swipe, live region 및 병렬 stack이 필요하면 Lyrd core가 아니라 Toast 전용 도구를 사용한다.

편의 메서드에 새 옵션을 계속 추가해 범위를 넓히지 않는다. Alert나 Confirm의 제한을 넘는 요구는
해당 request 타입을 과도하게 확장하는 대신 `open()`으로 이동한다.

## 설계 원칙

### 1. `open()`의 입력은 불변 스냅샷이다

다음 호출은 `projectId`의 현재 값을 사용해 하나의 작업을 시작한다.

```tsx
overlay.open(<ProjectSheet projectId={projectId} />)
```

이 호출은 부모 컴포넌트의 이후 render와 열린 element를 연결하지 않는다. 부모의 `projectId`가
바뀌어도 이미 열린 ProjectSheet의 props를 자동으로 교체하지 않는다.

열린 뒤 바뀌는 값은 컴포넌트가 소유한다.

```tsx
function ProjectSheet({ projectId }: { projectId: string }) {
  const project = useProject(projectId)
  const [tab, setTab] = useState('general')

  // project와 tab의 변경은 일반적인 React 상태 흐름으로 처리한다.
}
```

외부 작업의 진행 상태도 변경되는 값 자체보다 안정적인 식별자를 전달한다.

```tsx
overlay.open(<UploadProgress taskId={taskId} />)

function UploadProgress({ taskId }: { taskId: string }) {
  const progress = useUploadProgress(taskId)
  return <Progress value={progress} />
}
```

이 원칙에 따라 `handle.update()`와 `openOrUpdate()`를 제공하지 않는다.

### 2. 커스텀 오버레이의 표현 방식은 element가 소유한다

Lyrd는 다음 호출을 모두 같은 custom session으로 취급한다.

```tsx
overlay.open(<ProjectDialog />)
overlay.open(<ProjectSheet />)
overlay.open(<MobileBottomSheet />)
overlay.open(<CommandPalette />)
```

중앙 Dialog인지, 화면 측면의 Sheet인지, 모바일 Bottom Sheet인지는 element가 사용하는 UI
primitive와 CSS가 결정한다. `overlay.dialog()`, `overlay.sheet()`, `overlay.drawer()`처럼 표현
방식마다 별도 메서드를 추가하지 않는다.

### 3. Modal orchestration은 FIFO queue가 아니라 LIFO stack이다

활성 Dialog 안에서 confirm 결과를 기다리는 흐름은 정상적인 제품 요구다.

```tsx
const confirmed = await overlay.confirm({
  heading: '변경사항을 버릴까요?',
  tone: 'danger',
  primaryAction: '버리기',
})
```

단일 FIFO queue에서는 부모 Dialog가 닫혀야 confirm이 열리고, 부모는 confirm 결과를 기다리는
교착 상태가 생길 수 있다. LIFO stack에서는 confirm이 부모 위에 즉시 열리고, confirm이 먼저
닫힌 뒤 부모 Dialog로 돌아간다.

```text
ProjectDialog
ProjectSheet
Confirm        <- topmost
```

모든 Application API의 새 세션은 stack 위에 추가된다. ESC와 outside press는 topmost 세션에만
전달된다.

## 공개 Application API

```ts
export type OverlayRequestMap = {
  alert: object
  confirm: object
}

export type AlertBehavior = {
  onAction?: () => void
}

export type AlertRequest<Fields extends object> =
  Fields extends unknown
    ? Omit<Fields, keyof AlertBehavior> & AlertBehavior
    : never

export type ConfirmBehavior = {
  onConfirm?: () => void | Promise<void>
  closeOnEscape?: boolean
  closeOnOutsidePress?: boolean
}

export type ConfirmRequest<Fields extends object> =
  Fields extends unknown
    ? Omit<Fields, keyof ConfirmBehavior> & ConfirmBehavior
    : never

export type OverlayClient<Requests extends OverlayRequestMap> = {
  alert(
    request: AlertRequest<Requests['alert']>,
  ): OverlayHandle<void>

  confirm(
    request: ConfirmRequest<Requests['confirm']>,
  ): OverlayHandle<boolean>

  open<Result = void>(
    element: ReactElement,
    options?: OpenOptions,
  ): OverlayHandle<OverlayOutcome<Result>>

  close(reason?: OverlayCloseReason): boolean

  closeAll(reason?: OverlayCloseReason): void
}

export type OverlayScope<Requests extends OverlayRequestMap> = {
  OverlayProvider: ComponentType<OverlayProviderProps<Requests>>
  useOverlay(): OverlayClient<Requests>
  createClient(): OverlayClient<Requests>
}

export function createOverlayScope<Requests extends OverlayRequestMap>():
  OverlayScope<Requests>
```

`title`, `description`, `tone`, `confirmLabel` 같은 표시 필드는 Core 타입이 아니다. 앱이 자신의
Renderer와 제품 언어에 맞는 필드를 정의한다.

```ts
type AppAlertFields = {
  message: ReactNode
  actionLabel?: ReactNode
  icon?: ReactNode
}

type AppConfirmFields =
  | {
      heading: ReactNode
      body?: ReactNode
      tone?: 'neutral' | 'warning'
      primaryAction?: ReactNode
      secondaryAction?: ReactNode
    }
  | {
      heading: ReactNode
      body?: ReactNode
      tone: 'danger'
      primaryAction: ReactNode
      secondaryAction?: ReactNode
    }

const appOverlay = createOverlayScope<{
  alert: AppAlertFields
  confirm: AppConfirmFields
}>()
```

일반 호출자가 배우는 메서드는 다음 다섯 개다.

- `alert()`: 내용을 인지하는 단일 행동 레시피
- `confirm()`: 확인 또는 취소를 선택하는 레시피
- `open()`: 임의의 커스텀 modal overlay를 여는 기본 API
- `close()`: 현재 topmost 세션 하나를 닫는 stack 제어 API
- `closeAll()`: 현재 client가 소유한 모든 세션을 닫는 API

Scope가 반환한 `useOverlay()`는 같은 request map으로 타입이 연결된 `OverlayClient`를 반환한다.

```tsx
function DeleteProjectButton() {
  const overlay = appOverlay.useOverlay()

  async function deleteProject() {
    const confirmed = await overlay.confirm({
      heading: '프로젝트를 삭제할까요?',
      tone: 'danger',
      primaryAction: '삭제',
    })

    if (!confirmed) return
    // 삭제 작업
  }
}
```

## OverlayHandle

모든 Application API는 실제 Promise에 정확한 세션을 닫는 메서드를 추가한 Handle을 반환한다.

```ts
export type OverlayHandle<Value> = Promise<Value> & {
  close(reason?: OverlayCloseReason): boolean
}
```

단순한 호출자는 바로 `await`한다.

```tsx
const confirmed = await overlay.confirm({
  heading: '계속할까요?',
})
```

정확한 세션을 나중에 닫아야 하는 호출부만 Handle을 보관한다.

```tsx
const editor = overlay.open(<DocumentEditor />)

editor.close()
const outcome = await editor
```

각 close API의 대상은 다음과 같다.

| API | 대상 |
| --- | --- |
| `overlay.close()` | 현재 stack의 topmost 세션 |
| `handle.close()` | Handle이 가리키는 정확한 세션 |
| `overlay.closeAll()` | 해당 client가 소유한 모든 세션 |

활성 세션을 실제로 closing 상태로 바꾸면 `true`, 이미 settle되었거나 존재하지 않으면 `false`를
반환한다. `close()`는 실행 중인 데이터 요청을 취소하지 않는다. 네트워크 요청 취소는
애플리케이션이 `AbortSignal` 등의 별도 수단으로 처리한다.

## `open()`과 결과

```ts
export type OpenOptions = {
  closeOnEscape?: boolean
  closeOnOutsidePress?: boolean
}
```

두 옵션의 기본값은 `true`다. 실제 ESC와 outside press 감지 및 focus 처리는 앱이 선택한 UI
primitive가 담당하고, Lyrd는 renderer가 전달한 close 요청에 정책을 적용한다.

```tsx
const editor = overlay.open<{ documentId: string }>(
  <DocumentEditor initialDocumentId="document-1" />,
  {
    closeOnEscape: false,
    closeOnOutsidePress: false,
  },
)
```

범용 세션의 결과는 정상 완료와 결과 없는 close를 구분한다.

```ts
export type OverlayCloseReason =
  | 'cancel'
  | 'escape'
  | 'outside'
  | 'route-change'
  | 'programmatic'

export type OverlayCloseRequestReason = 'escape' | 'outside'

export type OverlayOutcome<Result> =
  | { status: 'resolved'; value: Result }
  | { status: 'closed'; reason: OverlayCloseReason }
```

```tsx
const outcome = await editor

if (outcome.status === 'resolved') {
  refreshDocument(outcome.value.documentId)
}
```

종료 방식별 Promise 결과는 다음과 같다.

| 종료 방식 | `await overlay.open()` 결과 |
| --- | --- |
| `session.resolve(value)` | `{ status: 'resolved', value }` |
| `session.close('cancel')` | `{ status: 'closed', reason: 'cancel' }` |
| ESC close 요청 | `{ status: 'closed', reason: 'escape' }` |
| Outside press close 요청 | `{ status: 'closed', reason: 'outside' }` |
| `handle.close()` | `{ status: 'closed', reason: 'programmatic' }` |
| `overlay.close()` | `{ status: 'closed', reason: 'programmatic' }` |
| `overlay.closeAll('route-change')` | `{ status: 'closed', reason: 'route-change' }` |

결과가 필요 없는 custom overlay는 Result 제네릭을 생략한다. 기본 Result는 `void`이며, JSX props는
React가 이미 검사하므로 `open()`에 별도의 Input 제네릭을 추가하지 않는다.

```tsx
const outcome = await overlay.open(<InformationSheet />)
```

`open()`은 호출마다 새 세션을 만든다. 자동 dedupe, React `key` 기반 공유, identity 검색은 하지
않는다.

## `alert()` 레시피

Scope의 `alert` 필드는 앱이 정의하는 표시 request이고, Core는 동기 `onAction` 필드만 예약한다.

```ts
export type AlertBehavior = {
  onAction?: () => void
}

export type AlertRequest<Fields extends object> =
  Fields extends unknown
    ? Omit<Fields, keyof AlertBehavior> & AlertBehavior
    : never
```

```tsx
await overlay.alert({
  message: '저장되었습니다.',
  icon: <CheckIcon />,
  actionLabel: '확인',
  onAction: () => trackAlertAction(),
})
```

다른 앱은 `title`, `description`, `buttonText` 같은 전혀 다른 표시 필드명을 사용할 수 있다.
Controller는 `onAction`을 분리하고 나머지 request를 Alert renderer에 전달한다.

`alert()`는 내용을 인지하는 하나의 명시적 행동만 제공한다. Alert는 기본적으로 ESC와 outside
press로 닫히지 않으며 renderer의 `action()`, `handle.close()`, `overlay.close()` 또는
`overlay.closeAll()`로 종료한다.

Alert가 action 또는 close되면 Handle은 `void`로 resolve된다. 호출부에 close 이유를
노출하지 않는 것은 제품 레시피의 단순한 결과 계약이다.

`onAction`은 Alert의 단일 버튼에서 실행할 선택적인 동기 callback이다.

```text
사용자가 Alert 버튼을 누름
  -> Renderer가 Core의 action() 명령 호출
  -> Core가 사용자의 request.onAction() callback을 동기 실행
  -> Alert Handle을 void로 resolve하고 closing
```

- `overlay.alert()`: Alert 세션을 여는 Application API
- `renderer.action()`: 사용자가 단일 버튼을 눌렀다고 Core에 알리는 Renderer 명령
- `request.onAction()`: Core가 action 시점에 실행하는 사용자 callback

`onAction`에는 pending, error, retry가 없다. Promise를 반환하는 함수는 지원하지 않으며 개발
환경에서 thenable 반환을 감지하면 `confirm()` 또는 `open()`을 사용하라는 warning을 출력한다.
TypeScript의 `() => void`는 async 함수 전달을 완전히 차단하지 못하므로 runtime warning을 함께
사용한다. 동기 callback이 throw해도 Alert error 상태로 전환하지 않으며, Core는 Alert의 close를
보장한 뒤 오류를 다시 전달한다. 실패를 UI에 표시하거나 재시도해야 하는 작업은 Alert 범위가 아니다.

`handle.close()`, `overlay.close()`, `closeAll()` 및 route change는 명시적인 action이 아니므로
`onAction`을 실행하지 않는다. 일반적인 Alert에는 callback이 필요하지 않으며 호출부는
`await overlay.alert()` 다음 줄에서 흐름을 계속한다.

## `confirm()` 레시피

Core는 confirm의 표시 필드를 정의하지 않고 다음 행동 필드만 예약한다.

```ts
export type ConfirmBehavior = {
  onConfirm?: () => void | Promise<void>
  closeOnEscape?: boolean
  closeOnOutsidePress?: boolean
}

export type ConfirmRequest<Fields extends object> =
  Fields extends unknown
    ? Omit<Fields, keyof ConfirmBehavior> & ConfirmBehavior
    : never
```

`tone`, `heading`, `primaryAction`과 그 필드 사이의 조건부 타입은 앱이 정의한다. 예를 들어 danger
confirm에 구체적인 행동 문구를 강제하는 규칙도 `AppConfirmFields`의 union으로 표현한다.

```tsx
const confirmed = await overlay.confirm({
  heading: '계속할까요?',
})
```

사용자 작업을 함께 전달할 때도 하나의 request 객체를 사용한다.

```tsx
const confirmed = await overlay.confirm({
  heading: '프로젝트를 삭제할까요?',
  body: '이 작업은 되돌릴 수 없습니다.',
  tone: 'danger',
  primaryAction: '프로젝트 삭제',
  onConfirm: () => deleteProject(),
})
```

표시 데이터와 행동 options를 두 객체로 나누지 않는 이유는 `onConfirm`만 별도 인자에 있는 호출이
사용자에게 불필요하게 낯설기 때문이다. 대신 예약 필드를 호출 request에 교차하고, Controller가
입력 시점에 표시 request와 행동 설정으로 분리한다.

```ts
const {
  onConfirm,
  closeOnEscape,
  closeOnOutsidePress,
  ...rendererRequest
} = input
```

사용자가 정의하는 confirm fields가 `onConfirm`, `closeOnEscape`, `closeOnOutsidePress`를 다시
선언하면 scope 생성 타입에서 충돌 오류를 낸다. 예약 필드의 타입을 조용히 덮어쓰거나 두 의미를
동시에 허용하지 않는다.

`confirm()`의 boolean 결과는 다음과 같다.

- 확인 또는 성공한 비동기 `onConfirm`: `true`
- cancel, ESC, outside press, programmatic close, route change: `false`

`onConfirm`은 사용자가 확인 의도를 받아 실행할 동기 또는 비동기 작업이다.

- `onConfirm`이 없으면 renderer의 `confirm()` 명령 즉시 `true`로 완료한다.
- 동기 함수가 정상 반환하면 `true`로 완료하고, throw하면 error 상태로 전환한다.
- Promise를 반환하면 pending으로 전환하고, resolve하면 `true`로 완료한다.
- Promise가 reject되면 열린 상태를 유지하고 error를 renderer에 전달한다.
- error 상태에서 renderer가 `confirm()`을 다시 호출하면 같은 `onConfirm`을 재실행한다.

pending 중에는 사용자의 ESC, outside press 및 cancel 요청을 차단한다. `handle.close()`,
`overlay.close()`, `overlay.closeAll()`은 명시적인 애플리케이션 명령이므로 pending 중에도 세션을
닫을 수 있다. 이미 시작한 `onConfirm` 작업은 자동으로 취소하지 않으며, 늦은 완료 결과는
무시한다.

Confirm request는 열린 뒤 변경하지 않는다. `pending`과 `error`는 외부 request update가 아니라
Lyrd가 소유하는 action 상태다.

### `confirm()` 명령과 `onConfirm()` callback

두 이름은 서로 다른 호출 방향을 나타낸다.

```text
사용자가 확인 버튼을 누름
  -> Renderer가 Core의 confirm() 명령 호출
  -> Core가 사용자의 request.onConfirm() callback 실행
  -> 성공하면 true로 resolve하고 closing
  -> 실패하면 error 상태로 열린 UI 유지
```

- `overlay.confirm()`: confirm 세션을 여는 Application API
- `renderer.confirm()`: 사용자가 확인했다고 Core에 알리는 Renderer 명령
- `request.onConfirm()`: 확인 시 Core가 실행하고 완료 여부를 관찰하는 사용자 callback

`on` 접두어는 단순히 작업 완료 후를 뜻하지 않는다. 어떤 사건이 발생했을 때 Core가 호출하는
사용자 callback임을 나타낸다. Renderer에서 Core 방향으로 호출하는 함수는 command이므로 `on`
접두어 없이 `confirm()`, `cancel()`, `requestClose()`, `completeClose()`로 명명한다.

### `onCancel`을 Core 예약 필드로 두지 않는 이유

`onConfirm`은 대칭적인 이벤트 hook이 아니라 비동기 작업의 pending, error, retry를 Core가
관리하기 위한 행동 필드다. 일반적인 cancel은 별도 작업 없이 boolean 결과를 `false`로 확정하므로
Core 예약 `onCancel`을 추가하지 않는다.

```tsx
const confirmed = await overlay.confirm({
  heading: '삭제할까요?',
})

if (!confirmed) {
  // cancel, ESC, outside press 또는 programmatic close
}
```

앱이 명시적인 취소 버튼 클릭만 별도로 처리해야 한다면 AppConfirmFields에 `onCancel`을 추가하고
Renderer가 실행한 뒤 `cancel()` 명령을 호출한다.

```tsx
function handleCancel() {
  request.onCancel?.()
  cancel()
}
```

앱이 정의한 `onCancel`은 명시적인 취소 버튼에만 실행한다. ESC, outside press,
`overlay.close()`, `closeAll()`에는 실행하지 않는다. 비동기 취소 작업과 pending/error UI가
필요하면 Renderer가 직접 관리하거나 `open()`으로 별도 행동 흐름을 만든다.

### Renderer가 작업 상태를 직접 관리하는 방식

사용자가 Core의 비동기 정책을 원하지 않으면 예약 `onConfirm`을 생략하고 앱 request에 다른
이름의 작업 필드를 둘 수 있다.

```ts
type AppConfirmFields = {
  heading: ReactNode
  primaryAction?: ReactNode
  perform?: () => void | Promise<void>
}
```

이 모드에서는 Renderer가 직접 pending과 error를 관리하고 작업 성공 뒤 `confirm()` 명령을
호출한다.

```tsx
async function handleConfirm() {
  try {
    setPending(true)
    setError(null)
    await request.perform?.()
    confirm()
  } catch (error) {
    setError(error)
  } finally {
    setPending(false)
  }
}
```

기본 문서와 CLI 템플릿은 Core 관리 방식만 사용한다. Renderer 직접 관리 방식은 고급 경로로
문서화한다. 동일한 작업을 사용자 필드와 예약 `onConfirm` 양쪽에 전달하면 중복 실행될 수 있으므로
두 방식을 한 요청에서 함께 사용하지 않는다.

## 커스텀 세션 훅

`open()`으로 열린 element 내부에서는 `useOverlaySession()`으로 자신의 세션을 제어한다.

```ts
export type OverlayPhase = 'opening' | 'open' | 'closing'

export type OverlaySession<Result> = {
  open: boolean
  phase: OverlayPhase
  resolve(value: Result): boolean
  close(reason?: OverlayCloseReason): boolean
  requestClose(reason: OverlayCloseRequestReason): boolean
  completeClose(): void
}

export function useOverlaySession<Result = void>(): OverlaySession<Result>
```

```tsx
function ProjectSheet() {
  const session = useOverlaySession<{ saved: true }>()

  return (
    <Sheet
      open={session.open}
      onOpenChange={(open) => {
        if (!open) session.requestClose('outside')
      }}
      onOpenChangeComplete={(open) => {
        if (!open) session.completeClose()
      }}
    >
      <button onClick={() => session.close('cancel')}>취소</button>
      <button onClick={() => session.resolve({ saved: true })}>저장</button>
    </Sheet>
  )
}
```

- `resolve(value)`: 결과를 확정하고 closing으로 전환한다.
- `close(reason)`: 결과 없이 현재 세션을 closing으로 전환한다.
- `requestClose(reason)`: topmost 여부와 close 옵션을 확인한 뒤 close를 시도한다.
- `completeClose()`: exit transition이 끝났음을 알리고 stack에서 세션을 제거한다.

JSX의 result 타입을 `open<Result>()`와 `useOverlaySession<Result>()`에서 각각 선언하므로 두 타입이
컴파일 시점에 자동 연결되지 않는 한계가 있다. 이 한계를 해결하기 위해 definition 계층을 다시
도입하지 않는다. 실제 오류 사례가 반복되면 별도의 작은 타입 helper를 새 RFC에서 검토한다.

## Renderer API

`alert`와 `confirm`의 UI는 애플리케이션이 소유하는 로컬 renderer가 담당한다. Renderer가 Core에
보내는 함수는 callback prop이 아니라 상태 전이 command라는 의미를 드러내기 위해 동사형 이름을
사용한다.

```ts
export type AlertRendererProps<Request> = {
  open: boolean
  phase: OverlayPhase
  request: Request
  action(): void
  completeClose(): void
}

export type ConfirmActionStatus = 'idle' | 'pending' | 'error'

export type ConfirmRendererProps<Request> = {
  open: boolean
  phase: OverlayPhase
  actionStatus: ConfirmActionStatus
  error: unknown | null
  request: Request
  confirm(): void
  cancel(): void
  requestClose(reason: OverlayCloseRequestReason): void
  completeClose(): void
}

export type OverlayRenderers<Requests extends OverlayRequestMap> = {
  alert: ComponentType<AlertRendererProps<Requests['alert']>>
  confirm: ComponentType<ConfirmRendererProps<Requests['confirm']>>
}
```

Alert renderer의 `request`에는 `onAction`을 넣지 않고, Confirm renderer의 `request`에는
`onConfirm`과 close 정책 필드를 넣지 않는다. 이 필드는 Controller가 별도의 behavior로 보관하므로
Renderer가 사용자 callback과 Core command 중 무엇을 호출할지 고민하지 않는다.

기존 `status` 하나에 `mounting`, `pending`, `error`, `closing`을 섞지 않는다.

- `phase`: overlay UI의 열림·닫힘 수명주기
- `actionStatus`: confirm의 비동기 행동 상태

Renderer는 활성 세션이 있을 때만 mount되므로 `request`는 nullable이 아니며 `idle` overlay phase를
노출하지 않는다.

## Provider와 외부 호출

앱은 request map을 한 번 지정해 typed scope를 만든다. Core의 전역 기본 `useOverlay()`가 아니라
scope에 묶인 Provider와 hook을 앱 모듈에서 export한다.

```tsx
export const appOverlay = createOverlayScope<{
  alert: AppAlertFields
  confirm: AppConfirmFields
}>()

export const OverlayProvider = appOverlay.OverlayProvider
export const useOverlay = appOverlay.useOverlay
```

일반 컴포넌트는 앱 모듈의 typed hook을 사용한다.

```tsx
const overlay = useOverlay()
```

React 밖에서 호출하거나 테스트에 격리된 인스턴스가 필요하면 같은 scope의 `createClient()`를
사용한다.

```tsx
const overlay = appOverlay.createClient()

root.render(
  <OverlayProvider
    client={overlay}
    renderers={{
      alert: AlertRenderer,
      confirm: ConfirmRenderer,
    }}
  >
    <App />
  </OverlayProvider>,
)
```

사용자가 호출하는 객체에는 `client`, 내부 상태 전이 구현에는 `controller` 용어를 사용한다.
`createOverlayController()`와 request 타입이 연결되지 않은 전역 `createOverlayClient()`는 공개
export에서 제거하고 내부 구현 세부 사항으로 내린다. 보통 한 앱 root에는 하나의 scope를 사용하며,
격리가 필요한 microfrontend 또는 테스트만 별도 scope/client를 만든다.

## Stack과 close 수명주기

새 세션은 항상 stack의 top에 추가되고 즉시 opening 단계로 들어간다. 아래 세션은 unmount하거나
새로 만들지 않고 자신의 state를 유지한다.

```text
open(element)
  -> stack push
  -> opening
  -> open
  -> resolve(value) 또는 close(reason)
  -> Promise settle
  -> closing
  -> completeClose()
  -> stack remove
```

세부 규칙은 다음과 같다.

1. `overlay.close()`는 topmost 세션만 closing으로 전환한다.
2. topmost 세션이 이미 closing이면 `overlay.close()`는 `false`를 반환한다.
3. closing 중 연속 ESC가 아래 세션을 닫지 않도록 top은 `completeClose()`까지 stack에 남는다.
4. `handle.close()`는 top 여부와 관계없이 자신이 가리키는 정확한 세션을 닫을 수 있다.
5. top이 아닌 세션을 닫아도 그 위 세션의 위치와 수명주기는 유지한다.
6. `requestClose()`는 topmost 세션에서만 성공한다.
7. `closeAll()`은 모든 활성 세션의 Promise를 확정하고 closing으로 전환한다.
8. 각 세션은 자신의 exit transition이 끝난 뒤 `completeClose()`로 제거된다.
9. 이미 settle된 세션의 늦은 resolve, close 및 비동기 완료 결과는 무시한다.
10. 개발 환경에서 closing이 장시간 완료되지 않으면 세션별 warning을 출력한다.

UI primitive가 중첩 포털의 focus, inert, aria-hidden 및 z-index를 올바르게 관리할 책임은
애플리케이션 renderer에 있다. Lyrd는 topmost 세션 판정과 close 명령 순서만 관리한다.

## Toast와 동시성 정책

Toast는 modal overlay와 수명주기가 다르므로 이 세션 stack에 넣지 않는다.

| Modal overlay | Toast |
| --- | --- |
| 사용자 결정을 기다린다 | 정보를 잠시 전달한다 |
| 중첩 시 LIFO로 돌아간다 | 여러 항목을 동시에 쌓는다 |
| focus와 close 결과가 중요하다 | timeout, swipe, live region이 중요하다 |
| Promise 결과가 자연스럽다 | 일반적으로 반환 결과가 없다 |

`defineOverlayGroup({ strategy: 'parallel' })`로 두 모델을 하나의 runtime에 넣지 않는다. Toast는
제품 요구가 확인될 때 별도 API 또는 별도 패키지로 설계한다. 그때까지 core 공개 API, Storybook
통합 사례 및 CLI 생성 목록에서 Toast를 제거한다.

## 제거하는 공개 개념

호환 계층을 제공하지 않고 다음 API와 타입을 제거한다.

- `overlay.dialog()`
- `overlay.openOrUpdate()`
- `handle.update()`
- `defineOverlay()`
- `OverlayDefinition`
- `OverlayDefinitionComponentProps`
- `defineOverlayGroup()`
- `OverlayGroup`
- `OverlayGroupOptions`
- `OverlayGroupStrategy`
- `OverlayOpenOptions`
- `DialogOptions`
- `DialogSnapshot`
- `DialogStatus`
- `OverlayDialogApi`
- `useOverlayDialog()`
- `AlertSurfaceProps`
- `ConfirmSurfaceProps`
- 공개 `createOverlayController()`
- request map과 연결되지 않은 전역 `OverlayProvider`, `useOverlay`, `createOverlayClient`
- `dedupeKey`
- `dismiss`, `requestDismiss`, `completeExit`, `dismissAll` 명칭

다음 내부 구조도 제거한다.

- FIFO modal queue
- definition entry와 definition snapshot
- dialog entry와 definition entry의 분리
- parallel group session map
- identity 기반 활성 세션 검색
- options 병합 및 활성 group 불변 규칙
- Toast를 위한 generic parallel orchestration

## 유지하거나 새로 정의하는 공개 개념

- `createOverlayScope<Requests>()`
- scope에 연결된 `OverlayProvider`, `useOverlay()`, `createClient()`
- `OverlayRequestMap`
- `OverlayClient<Requests>`
- `AlertBehavior`
- `AlertRequest<Fields>`
- `ConfirmBehavior`
- `ConfirmRequest<Fields>`
- `overlay.alert()`
- `overlay.confirm()`
- `overlay.open()`
- `overlay.close()`
- `overlay.closeAll()`
- `OverlayHandle.close()`
- `useOverlaySession()`
- `OverlaySession`
- `OverlayPhase`
- `OverlayOutcome`
- `OverlayCloseReason`
- `OpenOptions`
- `AlertRendererProps`
- `ConfirmRendererProps`
- `OverlayRenderers`

## 구현 구조

Controller 내부 entry는 세 종류만 둔다.

```ts
type OverlayEntry = AlertEntry | ConfirmEntry | CustomEntry
```

공통 session 필드는 다음 책임만 가진다.

- controller-local 증가 ID
- Promise와 resolve 함수
- `opening`, `open`, `closing` phase
- settle 여부
- stack 순서
- close reason

Provider는 전체 stack snapshot을 구독하고 stack 순서대로 renderer를 출력한다. CustomEntry는
React element를 `OverlaySessionContext`로 감싸 렌더링한다. Alert와 Confirm은 등록된 로컬
renderer를 세션별로 렌더링한다.

AlertEntry와 ConfirmEntry는 사용자 표시 request와 Core behavior를 별도로 저장한다.

```ts
type AlertEntry<Request> = SessionEntry<void> & {
  request: Request
  behavior: {
    onAction?: () => void
  }
}
```

```ts
type ConfirmEntry<Request> = SessionEntry<boolean> & {
  request: Request
  behavior: {
    onConfirm?: () => void | Promise<void>
    closeOnEscape: boolean
    closeOnOutsidePress: boolean
  }
  actionStatus: ConfirmActionStatus
  error: unknown | null
}
```

Renderer snapshot에는 사용자 request만 노출하고 `behavior.onAction`과 `behavior.onConfirm`은
노출하지 않는다. Confirm에만 `actionStatus`와 `error`를 추가로 노출한다.

## 구현 순서

### 1단계: 타입 계약 고정

- 새 공개 타입의 compile-time 테스트를 작성한다.
- `createOverlayScope<Requests>()`가 client, Provider와 renderer request 타입을 함께 연결하게 한다.
- alert와 confirm 사용자 필드가 Core 예약 행동 필드와 충돌하면 컴파일 오류로 만든다.
- `open`, `close`, `closeAll`, Handle의 시그니처를 고정한다.
- Renderer API에서 phase와 actionStatus를 분리하고 command 이름에서 `on` 접두어를 제거한다.

### 2단계: stack runtime

- 단일 current와 FIFO queue를 session stack으로 교체한다.
- topmost close와 정확한 Handle close를 구현한다.
- 중첩 alert, confirm, custom element 렌더링을 구현한다.
- closing top이 아래 세션의 close를 막는 규칙을 구현한다.

### 3단계: JSX 기반 `open`

- dialog와 definition entry를 CustomEntry로 통합한다.
- `useOverlaySession` context를 세션별로 제공한다.
- custom session의 resolve, close, requestClose, completeClose를 연결한다.

### 4단계: 레시피 정리

- alert와 confirm도 공통 stack session 기반 Handle을 반환한다.
- alert의 `action()`이 동기 `onAction`을 실행한 뒤 void 결과로 닫히게 한다.
- Alert `onAction`이 thenable을 반환하면 개발 환경 warning을 출력하고 await하지 않는다.
- confirm의 pending, error, retry 정책을 유지한다.
- sync와 async `onConfirm`의 성공·실패 전이를 같은 경로로 처리한다.
- 사용자 request와 예약 behavior를 Controller 진입 시점에 분리한다.
- Renderer 직접 관리 방식에서는 예약 `onConfirm` 없이 `confirm()`으로 결과를 확정하게 한다.
- dedupe와 request update 경로를 제거한다.

### 5단계: 과도한 확장 계층 제거

- definition, openOrUpdate, group, parallel runtime을 삭제한다.
- Toast 통합 예제와 CLI 템플릿을 제거한다.
- 공개 export와 패키지 Changeset을 정리한다.

### 6단계: 전체 문서 전환

- README, core README, 문서 앱, Storybook, CLI 안내, llms 문서를 새 API로 바꾼다.
- 이전 API migration 문서는 호환 방법 대신 제거·대체 관계를 명시한다.

## 검증 기준

- `overlay.open(<Component />)`가 임의의 앱 소유 modal UI를 연다.
- 부모 overlay에서 `await overlay.confirm()`해도 교착 없이 confirm이 위에 열린다.
- 마지막에 열린 세션이 ESC와 `overlay.close()`를 먼저 처리한다.
- closing 중 연속 close가 아래 세션을 닫지 않는다.
- `handle.close()`가 top이 아닌 정확한 세션도 닫을 수 있다.
- 아래 세션은 위 세션이 열리고 닫히는 동안 컴포넌트 state를 유지한다.
- `closeAll('route-change')`가 모든 Promise를 올바른 결과로 확정한다.
- pending confirm의 UI close 요청은 차단되고 명시적인 Application API close는 동작한다.
- 앱이 정의한 alert와 confirm request 타입이 호출부와 Renderer에 동일하게 추론된다.
- 앱 request가 Core 예약 alert 또는 confirm 필드를 재정의하면 컴파일 오류가 발생한다.
- Alert renderer에는 예약 `onAction`이 아닌 표시 request와 `action()` 명령만 전달된다.
- `action()`은 동기 `onAction`을 한 번 실행하고 Alert를 void 결과로 닫는다.
- `handle.close()`, `overlay.close()`, `closeAll()`은 Alert의 `onAction`을 실행하지 않는다.
- Alert `onAction`이 thenable을 반환하면 Core가 await하지 않고 개발 환경 warning을 출력한다.
- Confirm renderer에는 예약 `onConfirm`과 close 정책이 아닌 표시 request만 전달된다.
- Renderer의 `confirm()` 명령이 동기와 비동기 `request.onConfirm()`을 각각 한 번만 실행한다.
- `onConfirm`이 없으면 `confirm()` 명령 즉시 `true`로 완료한다.
- Renderer 직접 관리 방식은 작업 성공 뒤 `confirm()`을 호출할 때만 `true`로 완료한다.
- 앱 정의 `onCancel`은 명시적인 `cancel()` 경로에서만 실행하고 다른 close 이유에는 실행하지 않는다.
- custom session의 resolve와 close가 `OverlayOutcome`으로 정확히 구분된다.
- custom session의 모든 종료 방식이 `resolved` 또는 reason을 가진 `closed` outcome으로 귀결된다.
- 각 세션은 `completeClose()` 전까지 mount 상태를 유지한다.
- 서로 다른 Provider/client 인스턴스의 stack이 섞이지 않는다.
- core bundle에 Toast, group, definition runtime이 남지 않는다.

## 대체 관계

이 RFC는 다음 결정을 대체한다.

- RFC 0002의 `overlay.dialog()`와 `useOverlayDialog()` 중심 범용 세션 계약
- RFC 0003의 `defineOverlay()`, definition input, `openOrUpdate()` 및 Handle update 계약
- RFC 0003의 `defineOverlayGroup()`과 parallel Toast orchestration
- RFC 0001과 RFC 0003의 단일 FIFO modal queue
- 기존 `dismiss`, `dismissAll`, `requestDismiss`, `completeExit` 공개 명칭

RFC 0001의 `alert`, `confirm` 제품 의도, 앱 소유 renderer, Base UI 비종속 원칙과 비동기
`onConfirm` 정책은 유지한다.

## 확정한 결정

1. Lyrd의 core 범위는 modal interaction으로 제한한다.
2. `alert`와 `confirm`은 제품 레시피로 유지한다.
3. 모든 커스텀 modal overlay는 `open(ReactElement)`로 연다.
4. element와 props는 생성 시점의 불변 입력으로 취급한다.
5. `update`, `openOrUpdate`, definition, group 및 parallel 정책을 제거한다.
6. 활성 modal은 FIFO queue가 아니라 LIFO stack으로 관리한다.
7. 공개 종료 명칭은 `close`, `closeAll`, `requestClose`, `completeClose`로 통일한다.
8. `overlay.close()`는 topmost 세션, `handle.close()`는 정확한 세션을 닫는다.
9. Toast는 core stack에 포함하지 않고 향후 별도 설계한다.
10. 패키지가 정식 버전 전이므로 제거된 API의 호환 계층을 제공하지 않는다.
11. Alert와 Confirm의 표시 request 필드는 앱이 `createOverlayScope()`에서 정의한다.
12. Alert의 동기 `onAction`, Confirm의 동기·비동기 `onConfirm`, `closeOnEscape`,
    `closeOnOutsidePress`만 Core 예약 행동 필드로 둔다.
13. Alert와 Confirm 호출은 표시 필드와 예약 행동 필드를 각각 하나의 객체로 받는다.
14. Renderer에는 예약 행동 필드를 제거한 request와 `action()` 또는 `confirm()` command를
    전달한다.
15. `request.onAction()`은 Alert Core가 동기 실행하는 사용자 callback이고,
    `renderer.action()`은 Core에 단일 행동 의도를 전달하는 command다.
16. `request.onConfirm()`은 Core가 실행하는 사용자 callback이고, `renderer.confirm()`은 Core에
    확인 의도를 전달하는 command다.
17. 예약 `onConfirm`을 생략한 Renderer 직접 관리 방식도 허용하되 기본 문서와 템플릿은 Core
    관리 방식을 사용한다.
18. `onCancel`은 Core 예약 필드로 추가하지 않고 필요한 앱이 자신의 request와 Renderer에서
    관리한다.
19. `open<Result>()`는 `OverlayHandle<OverlayOutcome<Result>>`를 반환하고 Result가 필요 없으면
    제네릭을 생략한다.
