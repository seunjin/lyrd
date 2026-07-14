# RFC 0002: 범용 Dialog 세션 계약

- 상태: 구현 중
- 작성일: 2026-07-14
- 담당: Lyrd 유지보수 팀
- 선행 RFC: [RFC 0001: 오버레이 의도 관리 시스템](0001-overlay-intent-system.md)

## 요약

`alert`와 `confirm` 다음의 확장은 화면 종류마다 새 API를 만드는 것이 아니라, 임의의 React UI를 하나의 오버레이 세션으로 여는 범용 `overlay.dialog()`다.

```tsx
const result = await overlay.dialog(<ProjectSettings projectId={projectId} />)
```

`ProjectSettings`가 중앙 Dialog, Drawer, 풀페이지 편집기, 명령 팔레트 중 무엇을 렌더링할지는 앱이 결정한다. Lyrd는 요청, Promise 결과, 중복 방지, 대기열, 닫힘 생명주기만 관리한다.

이 RFC는 구현을 추가하지 않는다. `alert`, `confirm` MVP를 유지하면서 범용 Dialog의 타입·수명주기·로컬 코드 생성 방향을 확정한다.

## 문제

`alert`와 `confirm`은 사용자의 행동과 반환 결과가 고정된 의도 API다. 프로젝트 설정, 문서 편집, 명령 실행 같은 흐름은 그렇지 않다.

- 같은 Drawer라도 설정, 상세 보기, 작성 흐름의 결과가 다르다.
- 앱마다 Base UI, Radix, 자체 컴포넌트 등 기반 UI가 다르다.
- `dialog`, `drawer`, `sheet`, `fullscreen`을 각각 Lyrd API로 만들면 Lyrd가 UI 프리미티브를 다시 분류·래핑하게 된다.
- 이름 기반 registry만 제공하면 단발성 화면을 빠르게 열기 어렵고, 화면 모양과 제품 의미를 미리 고정하게 된다.

Lyrd가 책임질 핵심은 “어떤 모양인가”가 아니라 “하나의 오버레이 세션을 열고 결과를 기다린다”는 행동이다.

## 목표

- `overlay.dialog(element, options)`로 임의의 앱 UI를 연다.
- 컴포넌트 props 전달은 일반 React JSX로 해결한다.
- 열린 UI가 타입 안전하게 결과를 반환하거나 취소할 수 있다.
- 렌더링 방식과 UI 프리미티브 선택은 앱에 남긴다.
- 현재 단일 대기열과 `completeClose()` 기반 전환 원칙을 보존한다.
- `overlay.*`를 호출부의 중심 API로 유지한다.

## 하지 않는 것

- `overlay.drawer()`, `overlay.sheet()`, `overlay.fullscreen()` 같은 표현 방식 API를 추가하지 않는다.
- Lyrd 패키지가 JSX, CSS, Button, 포털, focus trap을 제공하거나 강제하지 않는다.
- 스택, 중첩, 우선순위, 다중 동시 표시를 구현하지 않는다.
- `alert`, `confirm`을 범용 API로 다시 구현하지 않는다.

## 제안 API

### 호출부

```tsx
import { useOverlay } from '@lyrd/core'

function EditProjectButton({ projectId }: { projectId: string }) {
  const overlay = useOverlay()

  async function edit() {
    const result = await overlay.dialog(<ProjectSettings projectId={projectId} />, {
      dismiss: 'allow',
    })

    if (result?.saved) {
      refreshProject()
    }
  }

  return <button onClick={edit}>설정</button>
}
```

`element`는 호출부가 만든 React element다. 따라서 일반 props, Context, Suspense 경계, 디자인 시스템 컴포넌트를 평소와 같이 사용할 수 있다.

### 옵션

```ts
type DialogOptions = {
  dismiss?: 'allow' | 'block'
}
```

`dismiss`의 의미는 `confirm`과 같다. `kind`, 크기, 위치, 애니메이션은 옵션에 넣지 않는다. 그것들은 element가 렌더링하는 앱 UI의 책임이다.

### 기본 중복 방지

`dialog()`는 별도 ID 입력 없이 `element.type`과 React `key`가 같은 요청을 동일한 Dialog로 판단한다. 이미 열려 있거나 대기 중인 요청이 있으면 새 대기열 항목을 만들지 않고 기존 Promise를 반환한다.

```tsx
const first = overlay.dialog(<ProjectSettings projectId="a" />)
const duplicate = overlay.dialog(<ProjectSettings projectId="a" />)

first === duplicate // true
```

같은 컴포넌트를 서로 다른 인스턴스로 의도한 경우에만 React의 기존 `key`를 사용한다.

```tsx
overlay.dialog(<ProjectSettings key="project-a" projectId="a" />)
overlay.dialog(<ProjectSettings key="project-b" projectId="b" />)
```

내부 증가 ID는 각 요청의 비동기 완료 신호를 추적하는 용도이며 중복 판단에는 사용하지 않는다. UUID나 앱 전용 ID 입력은 요구하지 않는다.

### 결과를 반환하는 훅

React element는 생성 뒤에 Lyrd가 callback props를 주입할 수 없다. 따라서 열린 element 내부에서만 사용할 수 있는 `useOverlayDialog()` 훅을 제공한다.

```tsx
type OverlayDialogApi<Result> = {
  open: boolean
  status: 'open' | 'closing'
  resolve(result: Result): void
  dismiss(): void
  requestClose(): void
  completeClose(): void
}
```

```tsx
function ProjectSettings({ projectId }: { projectId: string }) {
  const dialog = useOverlayDialog<{ saved: true }>()

  return (
    <AppDrawer
      onOpenChange={(nextOpen) => !nextOpen && dialog.requestClose()}
      onOpenChangeComplete={(nextOpen) => !nextOpen && dialog.completeClose()}
      open={dialog.open}
    >
      <ProjectSettingsForm
        projectId={projectId}
        onCancel={dialog.dismiss}
        onSaved={() => dialog.resolve({ saved: true })}
      />
    </AppDrawer>
  )
}
```

- 저장, 선택, 완료처럼 제품 결과가 생기면 `resolve(result)`를 호출한다.
- 명시적 취소 버튼은 `dismiss()`를 호출한다.
- ESC·바깥 클릭 등 UI 기반 라이브러리의 닫힘 요청은 `requestClose()`로 보낸다.
- 닫힘 애니메이션이 끝난 뒤 `completeClose()`를 한 번 호출한다.

`dialog()`의 반환 타입은 `Promise<Result | undefined>`다. `undefined`는 사용자가 취소하거나 허용된 방식으로 닫았음을 뜻한다.

## UI 형태는 element가 소유한다

같은 API는 앱이 만든 서로 다른 UI를 열 수 있다.

```tsx
await overlay.dialog(<ProjectSettings projectId={projectId} />)
await overlay.dialog(<DocumentEditor documentId={documentId} />)
await overlay.dialog(<CommandPalette />)
```

첫 번째는 Drawer, 두 번째는 풀페이지 화면, 세 번째는 명령 팔레트일 수 있다. Lyrd는 이를 구별하거나 특정 프리미티브를 import하지 않는다.

이 구조는 `Components`를 앱의 개별 파일로 유지하는 원칙과도 맞는다. 예를 들어 CLI는 이후 다음처럼 특정 화면의 시작 파일을 생성할 수 있다.

```text
src/lyrd/dialogs/
  project-settings.tsx
  document-editor.tsx
```

생성기는 파일을 만들 뿐이며, 사용자는 공통 `AppDialogShell`을 감싸거나 각 파일에서 완전히 다른 UI 조합을 선택할 수 있다. 기존 파일은 덮어쓰지 않는다.

## 대기열과 닫힘 생명주기

`dialog()`도 현재 `alert`, `confirm`과 같은 중앙 대기열에 들어간다.

```text
alert / confirm / dialog(element)
              ↓
        하나의 대기열
              ↓
       현재 element 하나
              ↓
       completeClose()
              ↓
          다음 요청
```

`resolve()`와 `dismiss()`는 Promise 결과를 먼저 확정하고 closing 상태로 전환한다. 다음 요청은 `completeClose()`가 호출된 뒤에만 열린다. 애니메이션이 없는 UI도 `completeClose()`를 호출해야 한다.

`requestClose()`는 `dismiss: 'block'`과 같은 controller 정책을 확인한다. 렌더러는 pending 또는 닫힘 방지 규칙을 자체 구현하지 않는다.

## 내부 요청 ID와 SSR

Lyrd의 내부 요청 ID는 `crypto.randomUUID()`가 아니라 controller 인스턴스에만 존재하는 증가 숫자를 사용한다.

```ts
function createOverlayController() {
  let nextId = 1

  // 새 요청마다 id: nextId++
}
```

이 ID는 현재 요청과 비동기 완료·닫힘 신호를 안전하게 대조하기 위한 내부 구현 세부 사항이다. 브라우저 탭, 서버 요청, 사용자, 분석 이벤트를 전역으로 식별하지 않으므로 UUID일 필요가 없다. controller마다 숫자가 다시 `1`부터 시작해도 충돌하지 않는다.

`alert`와 `confirm`의 `dedupeKey`는 별도 개념이다. 두 API에는 React element 타입이 없으므로, 호출부가 같은 제품 사건의 결과를 공유하려 할 때만 의미 있는 문자열을 제공한다.

### SSR의 경계

오버레이는 사용자 입력을 기다리는 클라이언트 UI이므로, 서버 렌더링이나 React Server Component에서 `await overlay.alert()`·`await overlay.confirm()`·`await overlay.dialog()`를 호출할 수 없다. 서버는 HTML 응답을 만드는 동안 사용자 결정을 기다릴 수 없기 때문이다.

`OverlayProvider`, `useOverlay`, 생성된 렌더러는 클라이언트 경계에서만 사용한다. 서버 작업의 결과로 오버레이를 보여야 한다면 결과를 데이터로 반환하고, 클라이언트 이벤트 핸들러 또는 hydration 뒤의 명시적 클라이언트 로직에서 호출한다.

```tsx
// 서버의 사전 확인 결과를 받은 Client Component
const preflight = await getArchivePreflightAction(projectId)

if (preflight.requiresConfirmation) {
  const confirmed = await overlay.confirm({
    title: '보관할까요?',
    confirmLabel: '보관',
    dedupeKey: `archive-project:${projectId}`,
  })

  if (confirmed) await archiveProjectAction(projectId)
}
```

SSR 요청마다 controller를 전역 singleton으로 공유하지 않는다. Provider가 요청·렌더 트리마다 controller를 만들고, 실제 오버레이 요청은 hydration 이후의 클라이언트 controller에서만 발생해야 한다.

## 타입 추론의 제약

`overlay.dialog(<ProjectSettings />)`만으로는 TypeScript가 JSX element에서 Promise 결과 타입을 항상 추론할 수 없다. 첫 구현은 결과 타입을 호출부에서 명시하는 방식을 기본으로 둔다.

```tsx
const result = await overlay.dialog<{ saved: true }>(
  <ProjectSettings projectId={projectId} />,
)
```

반복되는 화면에서 더 강한 추론이 필요하면, element를 만드는 앱 로컬 helper를 사용한다.

```tsx
const projectSettings = createDialog<{ projectId: string }, { saved: true }>(
  ({ projectId }) => <ProjectSettings projectId={projectId} />,
)

const result = await overlay.dialog(projectSettings, { projectId })
```

이 helper는 `dialog(element, options)`의 대체 API가 아니다. 반복 사용되는 앱 로컬 화면에서 props와 결과 타입을 묶기 위한 선택적 편의 기능이다.

## 구현 전 검증 항목

구현을 시작하기 전에 다음 사례를 최소 하나씩 확보한다.

1. Base UI 기반 Drawer: 저장 결과를 호출부에 반환한다.
2. Radix 또는 자체 Dialog: 취소와 닫힘 애니메이션 완료를 연결한다.
3. 풀페이지 편집기: 라우트 전환과 `dismissAll()`의 관계를 검토한다.
4. 같은 컴포넌트와 key를 연속 호출하는 사례: 기존 Promise 공유를 검증한다.

이 사례를 통과하면 `@lyrd/core`에 controller·provider·hook을 추가하고, 렌더러와 대기열 테스트를 같은 변경으로 작성한다.

## 확정한 결정

- 범용 확장의 중심은 `overlay.dialog(element, options)`다.
- `element`는 앱이 소유한 임의의 React UI이며, 표현 방식은 Lyrd가 강제하지 않는다.
- 같은 `element.type + element.key`의 Dialog는 기존 Promise를 공유한다.
- 결과와 닫힘 제어는 열린 element 내부의 `useOverlayDialog()`로 수행한다.
- `dialog()`는 `Promise<Result | undefined>`를 반환한다.
- `alert`, `confirm`의 의미 API와 현재 대기열 정책은 유지한다.
- 내부 요청 ID는 controller 로컬 증가 숫자를 사용하며, 전역 UUID를 요구하지 않는다.
- 오버레이 요청은 클라이언트에서만 실행한다.
