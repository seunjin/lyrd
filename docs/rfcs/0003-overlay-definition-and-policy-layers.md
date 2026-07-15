# RFC 0003: 오버레이 정의와 정책 계층 분리

- 상태: 승인·4차 구현
- 작성일: 2026-07-15
- 담당: Lyrd 유지보수 팀
- 선행 RFC:
  - [RFC 0001: Lyrd 오버레이 의도 관리 시스템](0001-overlay-intent-system.md)
  - [RFC 0002: 범용 Dialog 세션 계약](0002-registered-overlay-contract.md)

## 요약

Lyrd는 자주 사용하는 `alert`, `confirm`에 검증된 UX와 안전한 기본값을 제공하면서,
애플리케이션이 정의한 임의의 오버레이도 같은 호출·결과·수명주기·중앙 정책 안에서
관리할 수 있어야 한다.

이를 위해 Lyrd를 다음 세 계층으로 분리하는 방향을 제안한다.

1. **세션 커널**: UI를 열고 결과를 기다리는 최소 런타임
2. **조정 정책**: 대기열, 병렬 실행, 교체, 중복 처리 같은 실행 규칙
3. **제품 레시피**: `alert`, `confirm`처럼 검증된 UX를 제공하는 상위 API

이 RFC는 `react-call`의 callable component 모델을 그대로 복제하지 않는다. 대신 다음
장점을 차용한다.

- 입력 props와 결과 타입을 선언 시점에 연결한다.
- 기본 호출과 중복 재사용을 명시적으로 구분한다.
- 범용 세션 커널에는 제품별 비동기 정책을 넣지 않는다.
- 커스텀 오버레이를 기본 오버레이와 같은 중앙 제어 언어로 다룬다.

Lyrd가 유지할 차별점은 다음과 같다.

- `alert`, `confirm`의 안전한 기본 UX
- 실제 닫힘 완료 신호에 연결되는 수명주기
- Provider와 controller 단위의 격리
- 앱이 소유하는 로컬 렌더러와 접근성 프리미티브
- 오버레이 종류에 맞는 중앙 조정 정책

## 제품 방향

Lyrd의 제품 방향을 다음 문장으로 정의한다.

> Lyrd는 검증된 오버레이 UX를 기본 경로로 제공하면서, 제품별 커스텀 오버레이도
> 같은 수명주기와 중앙 정책 안에서 제어할 수 있게 한다.

Lyrd는 Dialog, Drawer, Toast의 DOM과 접근성을 다시 구현하는 UI 프리미티브
라이브러리가 아니다. Base UI, Radix, shadcn/ui 또는 애플리케이션의 기존 UI가 실제
표현과 접근성을 담당한다.

| 영역 | 책임 |
| --- | --- |
| 포커스, 포털, 키보드, 접근성 | 선택한 UI 프리미티브 |
| `alert`, `confirm`의 기본 UX | Lyrd 제품 레시피 |
| Promise 결과, 닫힘 수명주기, 중앙 제어 | Lyrd 세션 커널 |
| 대기열, 병렬, 교체, 중복 처리 | Lyrd 조정 정책 |
| JSX, 스타일, 제품별 흐름 | 애플리케이션 |

## 현재 구조에서 해결할 문제

### 1. 입력 컴포넌트와 결과 타입이 연결되지 않는다

현재 `overlay.dialog()`는 결과 타입을 호출부에서 지정한다.

```tsx
const result = await overlay.dialog<{ saved: true }>(
  <ProjectSettings projectId={projectId} />,
)
```

열린 컴포넌트도 결과 타입을 별도로 지정한다.

```tsx
const dialog = useOverlayDialog<{ saved: true }>()
```

두 제네릭은 서로 연결되어 있지 않다. 다음처럼 서로 다른 타입을 써도 TypeScript가
오류를 발견하지 못한다.

```tsx
await overlay.dialog<{ saved: true }>(<ProjectSettings />)

// ProjectSettings 내부
const dialog = useOverlayDialog<{ selectedId: number }>()
```

범용 오버레이가 반복 사용될수록 이 문제는 호출부와 구현부의 계약을 약하게 만든다.

### 2. Dialog의 자동 중복 판정이 props를 무시한다

현재 Dialog는 `element.type`과 React `key`가 같으면 기존 Promise를 공유한다. props는
비교하지 않는다.

```tsx
overlay.dialog(<ProjectSettings projectId="a" />)
overlay.dialog(<ProjectSettings projectId="b" />)
```

두 element 모두 `key`가 없다면 같은 요청으로 취급된다. 두 번째 props는 렌더링되지
않고 첫 번째 Promise를 공유한다. 호출자가 반드시 React `key`를 기억해야 하므로
범용 API의 숨은 정책이 된다.

### 3. 하나의 전역 대기열이 모든 표현 방식의 규칙이 된다

현재 `alert`, `confirm`, `dialog`는 하나의 FIFO 대기열을 공유한다. Modal과 confirm에는
안전한 기본값이지만, Toast, progress, context menu 같은 오버레이에는 적합하지 않을 수
있다.

또한 현재 항목이 `completeClose()`를 호출하지 않으면 다음 항목이 열리지 않는다. 실제
애니메이션 완료와 연결하는 방식은 시간 기반 unmount보다 정확하지만, 하나의 연결
실수가 전체 전역 대기열을 막는 영향 범위를 가진다.

### 4. 범용 API의 이름이 표현 방식을 암시한다

RFC 0002의 `overlay.dialog()`는 Drawer, 풀페이지 편집기, 명령 팔레트도 연다. 동작은
범용 세션이지만 이름은 중앙 Dialog를 암시한다.

`dialog()`를 즉시 제거할 필요는 없지만, 재사용 가능한 범용 정의 API에는 `open`,
`present`, `defineOverlay`처럼 표현 방식에 중립적인 용어가 필요하다.

## 설계 원칙

### 원칙 A: 기본 경로와 확장 경로는 같은 세션 계약을 사용한다

`alert`, `confirm`은 별도 구현 세계가 아니라 범용 세션 커널 위의 제품 레시피여야
한다. 커스텀 Drawer와 confirm은 UI가 다르더라도 다음 언어를 공유한다.

- open
- resolve
- dismiss
- requestClose
- completeClose
- dismissAll

### 원칙 B: 안전한 기본값은 유지하되 숨은 정책은 줄인다

`confirm`의 pending 중 닫힘 차단처럼 의도 자체에 포함되는 안전 정책은 유지한다.
반면 범용 오버레이의 자동 dedupe처럼 호출자가 쉽게 예측하기 어려운 정책은 명시적인
API로 바꾼다.

### 원칙 C: 중앙 제어와 단일 전역 정책을 구분한다

모든 오버레이가 Lyrd의 중앙 제어를 사용하더라도 모두 같은 큐에서 실행될 필요는 없다.
중앙 제어는 각 오버레이가 적절한 조정 정책을 선택할 수 있다는 의미다.

### 원칙 D: UI 프리미티브는 애플리케이션이 선택한다

세션 커널은 Base UI, Radix 또는 특정 DOM 구조를 import하지 않는다. CLI가 생성하는
기본 레시피는 안전한 시작점을 제공하지만 생성된 코드는 애플리케이션이 소유한다.

### 원칙 E: Provider/controller 격리를 유지한다

모듈 전역 singleton보다 현재 controller 주입 구조를 유지한다. 이는 테스트, 여러 React
root, SSR 요청 경계, 향후 microfrontend 구성을 더 명시적으로 만든다.

## 제안하는 계층

### 1. 세션 커널

세션 커널은 다음 책임만 가진다.

- 호출별 식별자와 Promise 생성
- 입력 props 보관
- 결과 확정과 dismiss
- mount, open, closing, completeClose 수명주기
- 호출이 끝난 뒤의 안전한 정리
- controller 구독 snapshot 제공

세션 커널은 다음을 알지 않는다.

- 현재 UI가 Dialog, Drawer, Toast인지
- danger 버튼이 어떤 색인지
- 비동기 작업의 오류 문구가 무엇인지
- 같은 오버레이를 queue, parallel, upsert 중 무엇으로 실행할지

### 2. 조정 정책

향후 다음 실행 전략을 지원할 수 있다.

```ts
type OverlayStrategy = 'queue' | 'parallel' | 'replace'
```

- `queue`: 이전 세션이 닫힌 뒤 다음 세션을 연다.
- `parallel`: 여러 세션을 동시에 렌더링한다.
- `replace`: 기존 세션을 dismiss하고 새 세션으로 교체한다.

중복 재사용은 strategy와 분리한다.

```ts
overlay.open(definition, props)
overlay.upsert(definition, identity, props)
```

`open()`은 기본적으로 새로운 세션을 만든다. `upsert()`만 기존 세션을 재사용하고 props를
갱신한다. 이렇게 하면 중복 처리 의도가 호출부에 드러난다.

첫 `upsert` 계약은 다음과 같이 제한한다.

```ts
overlay.upsert(definition, identity, input, options?)
```

- `identity`는 필수 문자열이다.
- 같은 definition 객체와 identity를 가진 활성 `upsert` 세션만 재사용한다.
- 재사용하면 최초 Promise와 렌더러 인스턴스를 유지하고 input을 최신 값으로 바꾼다.
- 후속 호출에서 options를 생략하면 기존 options를 유지하고, 명시하면 새 options로 바꾼다.
- `open()`으로 만든 세션, 다른 identity, 이미 settle되어 closing 중인 세션은 공유하지 않는다.
- 대기 중인 세션도 재사용하여 실제로 열릴 때 최신 input을 렌더링한다.

필수 identity를 택한 이유는 업로드 ID나 작업 ID처럼 호출자가 이미 알고 있는 업무
식별자를 재사용 의도와 함께 드러내기 위해서다. definition 단위 singleton은 간단하지만
서로 다른 작업을 숨은 정책으로 합칠 수 있어 채택하지 않는다. `open()` options에
`dedupeKey`를 추가하는 방식도 새 세션 생성과 기존 세션 갱신이라는 서로 다른 의미를 한
API에 섞으므로 채택하지 않는다.

첫 구현에서는 현재 호환성을 위해 하나의 `queue` 그룹만 유지할 수 있다. 다중 그룹과
`parallel`, `replace`는 실제 Toast 또는 progress 사례가 준비된 뒤 구현한다.

### 3. 제품 레시피

`overlay.alert()`와 `overlay.confirm()`은 공개 API로 유지한다.

```tsx
await overlay.alert({
  title: '변경사항을 저장했습니다.',
})

const confirmed = await overlay.confirm({
  title: '프로젝트를 삭제할까요?',
  confirmLabel: '삭제',
  tone: 'danger',
  onConfirm: () => deleteProject(projectId),
})
```

`confirm` 레시피는 다음 정책을 계속 소유한다.

- 결과를 `boolean`으로 단순화한다.
- pending 중 중복 실행과 dismiss를 차단한다.
- 실패하면 열어 둔 채 error 상태를 제공한다.
- 다시 확인하면 같은 작업을 재시도한다.
- 기본 modal queue에 참여한다.

이 정책들은 범용 세션 커널에 넣지 않는다.

## 결정 제안 1: 재사용 오버레이 정의 API

### 추천안: controller에 전달하는 타입 정의 객체

```tsx
type ProjectSettingsProps = {
  projectId: string
}

type ProjectSettingsResult = {
  saved: true
}

export const projectSettings = defineOverlay<
  ProjectSettingsProps,
  ProjectSettingsResult
>(({ input, session }) => (
  <AppDrawer
    open={session.open}
    onOpenChange={(open) => !open && session.requestClose('outside')}
    onOpenChangeComplete={(open) => !open && session.completeClose()}
  >
    <ProjectSettingsForm
      projectId={input.projectId}
      onCancel={() => session.dismiss('cancel')}
      onSaved={() => session.resolve({ saved: true })}
    />
  </AppDrawer>
))
```

실제 생성 템플릿은 React Hooks 린터와 개발 도구가 일반 컴포넌트로 인식할 수 있도록
이름 있는 컴포넌트를 먼저 선언하고 `defineOverlay(Component)`로 묶는다. 위 코드는 타입
관계만 짧게 보여 주기 위한 축약형이다.

호출은 현재 Provider에서 얻은 API를 사용한다.

```tsx
const overlay = useOverlay()
const outcome = await overlay.open(projectSettings, { projectId })
```

정의 객체가 `Props`와 `Result`를 모두 보관하므로 `open()`이 둘을 함께 추론할 수 있다.
controller는 definition과 input을 저장하고 Provider는 definition의 컴포넌트를 렌더링한다.

#### 추천 이유

- 현재 Provider/controller 격리를 유지한다.
- definition이 모듈 전역 상태를 소유하지 않는다.
- 입력 타입과 결과 타입이 선언 한 곳에서 연결된다.
- 모든 호출이 중앙 controller를 지나므로 `dismissAll`과 조정 정책을 적용할 수 있다.
- alert와 confirm도 내부적으로 같은 definition 모델을 사용할 수 있다.

#### 비용

- `ProjectSettings.open()`보다 `overlay.open(projectSettings, props)`가 길다.
- 정의 컴포넌트가 `{ input, session }` 형태를 배워야 한다.
- 현재 `dialog(element)`와 별도의 개념을 하나 추가한다.

### 대안 A: Callable 자체가 컴포넌트이자 명령 객체

```tsx
const ProjectSettings = createOverlay<Props, Result>(Component)

<ProjectSettings />
const result = await ProjectSettings.open(props)
```

#### 장점

- 호출이 짧고 발견하기 쉽다.
- 컴포넌트 선언과 명령 API가 한 export에 모인다.
- React 컴포넌트를 함수처럼 호출한다는 모델이 명확하다.

#### 단점

- 각 Callable이 store와 Root를 소유하면 Lyrd의 중앙 controller와 충돌한다.
- 모듈 singleton, 다중 Root, HMR, 테스트 초기화 규칙이 복잡해진다.
- 모든 오버레이를 중앙에서 `dismissAll`하려면 별도 registry가 필요하다.
- 컴포넌트 함수에 명령 메서드를 붙이는 비일반적인 형태가 된다.

### 대안 B: 현재 `dialog(element)`만 유지

```tsx
await overlay.dialog<Result>(<ProjectSettings {...props} />)
```

#### 장점

- 가장 유연하고 추가 API가 없다.
- 일반 JSX로 props와 Context를 전달한다.

#### 단점

- 구현부와 호출부의 Result 타입을 연결할 수 없다.
- 반복 사용되는 제품 오버레이의 계약이 선언되지 않는다.
- 자동 dedupe와 React `key` 규칙이 계속 호출부로 노출된다.

### 제안 결론

타입 정의 객체를 기본 추천안으로 채택하고 `dialog(element)`는 단발성·마이그레이션용
escape hatch로 유지한다. 실제 사용 사례가 쌓이면 중립적인 `present(element)` 이름으로
정리할 수 있다.

## 결정 제안 2: 결과 모델

### 추천안: 범용 세션은 명시적인 Outcome을 반환한다

```ts
type OverlayDismissReason =
  | 'cancel'
  | 'escape'
  | 'outside'
  | 'route-change'
  | 'programmatic'

type OverlayOutcome<Result> =
  | { status: 'resolved'; value: Result }
  | { status: 'dismissed'; reason: OverlayDismissReason }
```

```tsx
const outcome = await overlay.open(projectSettings, { projectId })

if (outcome.status === 'resolved') {
  refreshProject()
}
```

#### 추천 이유

- `undefined`가 정상 결과인지 dismiss인지 모호하지 않다.
- route change와 사용자 취소를 구분할 수 있다.
- analytics와 복구 동작을 호출부에서 안전하게 선택할 수 있다.
- Result가 `boolean`, `null`, `undefined`를 포함해도 계약이 유지된다.

#### 비용

- 간단한 오버레이 호출부가 다소 장황해진다.
- 현재 `Promise<Result | undefined>`에서 마이그레이션이 필요하다.

### 대안 A: `Result | undefined`

#### 장점

- 현재 구현과 호환되고 사용이 짧다.
- 결과 존재 여부만 필요한 경우 충분하다.

#### 단점

- dismiss 이유를 잃는다.
- Result에 `undefined`가 들어가면 구분할 수 없다.
- `dismissAll(reason)`의 reason을 Promise 결과로 전달할 수 없다.

### 대안 B: dismiss 시 Promise reject

취소는 일반적인 사용자 선택이지 예외가 아니므로 추천하지 않는다. 모든 호출부에
`try/catch`를 강제하고 실제 오류와 사용자 취소를 섞는다.

### 제안 결론

범용 `open()`은 `OverlayOutcome<Result>`를 반환한다. `alert()`와 `confirm()`은 레시피가
이를 각각 `void`와 `boolean`으로 변환해 현재의 단순한 API를 유지한다.

## 결정 제안 3: 세션 API 전달 방식

### 추천안: 정의 컴포넌트에 타입이 연결된 `session` prop을 전달한다

```tsx
defineOverlay<Props, Result>(({ input, session }) => {
  session.resolve(result)
  session.dismiss('cancel')
  return <Overlay />
})
```

#### 추천 이유

- Result 타입이 definition에서 session까지 자동으로 이어진다.
- `useOverlayDialog<Result>()`처럼 내부에서 제네릭을 반복하지 않는다.
- 여러 세션을 병렬 렌더링해도 각 컴포넌트가 자신의 session을 직접 받는다.
- Context 캐스팅에 의존하지 않는다.

#### 비용

- 기존 앱 컴포넌트에 얇은 adapter 컴포넌트가 필요할 수 있다.
- `{ input, session }` envelope가 일반 props spread보다 조금 장황하다.

### 대안 A: 현재 Context hook 유지

```tsx
const session = useOverlayDialog<Result>()
```

#### 장점

- 깊은 자식에서도 prop drilling 없이 세션을 읽을 수 있다.
- 기존 구현과 사용법을 유지한다.

#### 단점

- definition의 Result와 hook의 Result가 타입 수준에서 연결되지 않는다.
- 여러 세션을 렌더링할 때 Context 경계 관리가 더 중요해진다.

### 절충안

최상위 정의 컴포넌트에는 typed `session` prop을 제공한다. 깊은 자식에서 필요한 경우
앱이 session을 prop으로 넘기거나, Lyrd가 제네릭을 받지 않는 `useCurrentOverlaySession()`
편의 훅을 추가할 수 있다. 편의 훅은 호출자가 Result를 새로 선언하지 못하게 한다.

## 결정 제안 4: 동시성과 그룹

### 확정안: definition과 분리된 명시적 실행 group

Toast 사례에서 검증한 공개 API는 다음과 같다.

```tsx
const toastGroup = defineOverlayGroup({ strategy: 'parallel' })

await overlay.open(toast, input, { group: toastGroup })
```

definition은 렌더링 계약이고 group은 호출의 실행 정책이므로 서로 분리한다. 동일한
definition을 기본 queue 또는 parallel group에서 상황에 맞게 사용할 수 있다. group을
생략한 호출은 기존 전역 modal queue에 참여하며, `alert`와 `confirm`은 계속 이 안전한
기본값만 사용한다.

첫 공개 group strategy는 실제 Toast에 필요한 `parallel`만 지원한다. parallel session은
각각 mount, open, closing, completeClose 상태와 Promise를 가지며 서로의 닫힘을 기다리지
않는다. `dismissAll()`은 기본 queue와 parallel session을 같은 reason으로 정리한다.
`upsert()`로 만든 활성 세션의 group은 중간에 바꿀 수 없다. 실행 위치를 바꾸려면 기존
세션을 settle한 뒤 새 세션을 열어야 한다.

#### 선택 이유

- 호출마다 `{ strategy: 'parallel' }`을 반복하지 않아 앱의 실행 정책을 한곳에 정의한다.
- definition에 group을 고정하지 않아 렌더링과 조정 정책을 독립적으로 조합한다.
- 현재 alert/confirm의 안전한 직렬화 동작을 보존한다.
- Base UI Toast의 live region, timeout, swipe, transition을 다시 구현하지 않고 Lyrd의
  Promise·중앙 dismiss 정책과 adapter로 연결한다.

### 대안 A: definition에 group 고정

호출은 짧아지지만 동일 definition을 다른 정책으로 사용할 수 없고 렌더링 정의가 실행
정책을 소유하게 되어 채택하지 않는다.

### 대안 B: 호출마다 strategy 전달

별도 group 선언은 필요 없지만 정책 문자열이 호출부마다 흩어지고 같은 목적의 오버레이가
서로 다른 정책으로 실행되기 쉬워 채택하지 않는다.

### 대안 C: Base UI Toast manager만 직접 호출

Toast만 보면 가장 단순하지만 Lyrd의 `OverlayOutcome`, route-change `dismissAll`, 다른
오버레이와 같은 중앙 관찰 경계를 잃는다. Base UI manager는 로컬 renderer 안에서
접근성·표현 수명주기를 담당하는 adapter로 사용한다.

## 비동기 작업 정책

범용 session은 pending과 error를 자동으로 관리하지 않는다. 커스텀 오버레이는 앱의
데이터 라이브러리 또는 로컬 상태를 사용할 수 있다.

`confirm`은 제품 레시피이므로 현재 `onConfirm` 정책을 유지한다.

향후 반복되는 패턴이 확인되면 별도 composition hook을 추가할 수 있다.

```tsx
const mutation = useOverlayMutation(session, onSubmit)
```

이 hook은 세션 커널의 필수 API가 아니며 별도 export로 추가한다. 이렇게 하면 generic
runtime을 작게 유지하면서 기본 confirm은 계속 편리하게 사용할 수 있다.

## 수명주기 정책

Lyrd는 `completeClose()`를 유지한다. 실제 UI 프리미티브의 애니메이션 완료 신호와
연결할 수 있기 때문에 고정 millisecond delay보다 정확하다.

다만 연결 누락의 부담을 낮추기 위해 다음을 검토한다.

- 애니메이션이 없는 렌더러용 `completeClose()` 자동 처리
- 개발 모드에서 closing 상태가 장시간 지속될 때 warning
- group이 도입되면 한 group의 closing 오류가 다른 group을 막지 않도록 격리

자동 timeout으로 강제 종료하는 것은 실제 애니메이션과 상태를 어긋나게 할 수 있으므로
기본 동작으로 사용하지 않는다.

## 외부 호출과 React 경계

현재 `createOverlayController()`와 `controller.overlay`를 사용하면 React 컴포넌트 밖에서도
호출할 수 있지만 중심 문서에는 `useOverlay()`만 드러나 있다.

향후 다음처럼 명시적인 app client를 제공하거나 현재 controller 방식을 문서화할 수 있다.

```tsx
export const appOverlay = createOverlayClient()

<OverlayProvider client={appOverlay}>
  <App />
</OverlayProvider>

await appOverlay.confirm(...)
```

이 기능은 store action이나 router integration에 유용하지만, 모듈 singleton을 강제하지
않아야 한다. 애플리케이션이 client 생성과 Provider 연결을 명시적으로 소유한다.

## 호환성과 마이그레이션

### 유지하는 API

- `overlay.alert()`
- `overlay.confirm()`
- `OverlayProvider`
- `createOverlayController()`
- `dismissAll()`

### 단계적으로 정리할 API

- `overlay.dialog(element, options)`
- `useOverlayDialog<Result>()`

첫 단계에서는 제거하지 않는다. `defineOverlay()`를 권장 경로로 추가하고 실제 앱 사례를
이전한 뒤 deprecation 여부를 결정한다.

자동 Dialog dedupe는 동작 변경 위험이 있으므로 다음 순서로 정리한다.

1. 같은 component type과 다른 props를 연속 호출하는 회귀 테스트를 추가한다.
2. `dialog()`의 자동 dedupe를 제거하거나 명시적 `dedupeKey` 옵션으로 변경한다.
3. 기존 React `key` 기반 dedupe가 필요하면 마이그레이션 문서를 제공한다.

현재 패키지가 `0.1.0-next` 단계이므로 공개 stable 이후보다 지금 계약을 바로잡는 비용이
낮다.

## 구현 단계

### 0단계: 방향 합의

- 이 RFC의 네 가지 결정 제안을 검토한다.
- API 명칭과 Outcome 모델에 합의한다.
- `dialog(element)`의 장기 위치를 결정한다.

### 1단계: 타입/API 프로토타입

- `OverlayDefinition<Props, Result>` 타입을 만든다.
- `defineOverlay()` 타입 추론 테스트를 작성한다.
- `overlay.open(definition, props)` 호출과 session result 연결을 타입 테스트로 검증한다.
- 이 단계에서는 현재 controller 동작을 변경하지 않는다.

### 2단계: 현재 queue에 definition 연결

- definition entry를 controller에 추가한다.
- Provider가 typed definition component를 렌더링한다.
- resolve, dismiss, requestClose, completeClose를 연결한다.
- alert, confirm, dialog의 기존 테스트를 유지한다.

### 3단계: 자동 dedupe 정리

- `dialog()`의 `element.type + key` 자동 공유를 제거한다.
- 명시적 identity가 필요한 실제 사례를 기준으로 `upsert` 또는 `dedupeKey`를 설계한다.
- 같은 definition을 다른 props로 연속 호출하는 사례를 검증한다.

### 4단계: 레시피 내부 통합

- alert와 confirm을 공통 session entry 모델 위에 정리한다.
- 공개 API와 렌더러 props는 호환성을 유지한다.
- confirm의 pending, error, retry 정책은 recipe 계층에 남긴다.

### 5단계: 다중 그룹 검증

- Toast 또는 progress overlay 예제를 하나 선택한다.
- queue와 parallel group을 동시에 렌더링한다.
- group별 dismissAll, close transition, 접근성 영향을 검증한다.
- 실제 사례가 충분하지 않으면 이 단계는 구현하지 않는다.

## 검증 기준

- definition의 Props와 Result가 호출부와 렌더러에서 함께 추론된다.
- 렌더러가 다른 Result 타입으로 resolve하려 하면 컴파일 오류가 발생한다.
- 같은 definition을 서로 다른 props로 호출하면 자동으로 Promise를 공유하지 않는다.
- 같은 definition과 identity를 upsert하면 Promise를 유지하며 최신 input을 렌더링한다.
- 일반 open, 다른 identity, settle된 세션은 upsert와 공유하지 않는다.
- confirm의 현재 pending, error, retry, dismiss 차단 동작이 유지된다.
- UI 프리미티브를 바꿔도 세션 커널을 수정하지 않는다.
- 애니메이션 완료 전에는 다음 queue 항목이 열리지 않는다.
- Provider/controller 인스턴스끼리 상태가 섞이지 않는다.

## 1차 구현 현황

2026-07-15에 다음 수직 흐름을 구현했다.

- `OverlayDefinition<Input, Result>`와 `defineOverlay()`
- `overlay.open(definition, input, options)`
- typed `{ input, session }` 렌더링 계약
- resolved/dismissed `OverlayOutcome<Result>`
- dismiss 이유와 `dismissAll('route-change')` 전달
- 현재 queue와 `completeClose()` 수명주기 연결
- `open()`과 legacy `dialog()`의 자동 dedupe 제거
- CLI Dialog 템플릿과 문서·Storybook 예제 전환

## 2차 구현 현황

2026-07-15에 공개 API 변경 없이 controller 내부의 공통 세션 흐름을 정리했다.

- alert, confirm, legacy dialog, typed definition이 같은 `SessionEntry<Kind, Result>` 기반을
  사용한다.
- Promise와 resolve 쌍은 공통 deferred factory에서 생성한다.
- 모든 entry가 같은 enqueue 함수와 settle/closing 전환을 사용한다.
- alert → definition → confirm 혼합 queue와 중복 settlement 무시를 회귀 테스트로
  고정했다.

## 3차 구현 현황

2026-07-15에 실제 업로드 진행률 사례를 기준으로 명시적인 재사용 정책을 구현했다.

- `overlay.upsert(definition, identity, input, options)` 공개 API
- definition 객체와 identity로 한정한 활성 세션 탐색
- 동일 Promise·컴포넌트 인스턴스를 유지하는 현재 input 갱신
- 다른 identity와 일반 `open()` 호출의 독립성
- queue에서 기다리는 동안의 최신 input 반영
- 최초 dismiss 정책을 보존하는 options 생략 규칙
- Base UI Dialog를 사용하는 업로드 진행률 Storybook 사례

## 4차 구현 현황

2026-07-15에 실제 Toast 사례를 기준으로 첫 동시성 group을 구현했다.

- `defineOverlayGroup({ strategy: 'parallel' })`
- `overlay.open()`과 `overlay.upsert()`의 선택적 `group` option
- 기본 queue snapshot과 독립된 다중 definition snapshot
- parallel session별 resolve, dismiss, requestClose, completeClose
- parallel session과 modal queue를 함께 정리하는 `dismissAll`
- 활성 upsert session의 group 불변 규칙
- Base UI Toast manager의 접근성·timeout·swipe·transition과 연결한 로컬 adapter
- Toast 3개 동시 실행과 Toast·confirm 동시 실행 Storybook 사례

별도 queue group, `replace`, group별 `dismissAll`은 실제 필요가 확인될 때 각각 설계한다.

## 확정한 결정

2026-07-15에 다음 방향으로 합의했다.

1. 호출 형태는 Provider/controller 격리를 유지하는 `overlay.open(definition, input)`을
   기본으로 한다.
2. 범용 결과는 `OverlayOutcome<Result>`를 사용한다. `alert()`와 `confirm()`은 각각
   `void`와 `boolean`으로 간단한 기본 API를 유지한다.
3. 정의 컴포넌트는 타입이 연결된 `{ input, session }` prop을 받는다.
4. `dialog(element)`와 `useOverlayDialog()`는 단발성 JSX와 마이그레이션용 escape hatch로
   당분간 유지한다.
5. `open()`과 `dialog()`은 자동 dedupe하지 않는다. 진행률처럼 동일 작업을 갱신할 때만
   필수 identity를 받는 `upsert()`로 활성 세션을 명시적으로 재사용한다.
6. group을 생략하면 안전한 기본 queue를 사용한다. Toast처럼 실제 동시성이 필요한 호출만
   `defineOverlayGroup({ strategy: 'parallel' })`로 명시적으로 분리한다.
