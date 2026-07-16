# @lyrd/core

제품의 alert, confirm과 커스텀 오버레이 세션을 중앙에서 관리하는 Lyrd의 React 런타임이다.

Lyrd는 Dialog 같은 UI 프리미티브를 다시 구현하거나 JSX와 스타일을 강제하지 않는다. 런타임은 요청, Promise 결과, 대기열과 정책을 관리하고 실제 UI는 애플리케이션이 소유한 로컬 렌더러가 담당한다.

## 설치

로컬 Base UI 렌더러와 함께 설치하려면 CLI를 사용한다.

```bash
pnpm dlx @lyrd/cli add overlay
```

런타임만 직접 설치할 수도 있다.

```bash
pnpm add @lyrd/core
```

반복 사용하는 커스텀 오버레이는 `defineOverlay<Input, Result>()`로 입력과 결과를 한 번에
정의하고 `overlay.open(definition, input)`으로 연다. 성공과 dismiss는
`OverlayOutcome<Result>`로 구분된다. `alert()`와 `confirm()`은 각각 `void`와 `boolean`을
반환하는 간단한 기본 경로를 유지한다.

진행률처럼 동일한 작업의 input을 계속 갱신할 때는
`overlay.upsert(definition, identity, input)`을 사용한다. 같은 definition과 identity의
활성 세션만 Promise와 렌더러 인스턴스를 공유하며, `open()` 호출과 다른 identity는 항상
독립 세션이다.

Toast처럼 여러 세션을 동시에 렌더링할 때는 `defineOverlayGroup({ strategy: 'parallel' })`로
정책을 선언하고 `overlay.open(definition, input, { group })`에서 선택한다. group을 생략한
호출은 기존 modal queue를 유지하며 `dismissAll()`은 두 경로를 함께 정리한다. Group은
전략만 감싼 플래그가 아니라 같은 실행 전략과 상태 공간을 공유하는 coordination boundary다.

일반 호출자는 `alert`, `confirm`, `open`, `upsert`, `dismissAll` Application API를 사용한다.
로컬 renderer와 definition 작성자는 `resolve`, `dismiss`, `requestDismiss`, `completeExit`
Renderer API를 UI primitive에 한 번 연결한다. `requestDismiss`는 `dismissPolicy`를 확인하며,
`completeExit`은 closing 이후 exit lifecycle이 끝났음을 런타임에 알린다.

사용법과 인터랙티브 데모는 [Lyrd 문서](https://seunjin.github.io/lyrd/)에서 확인할 수 있다.
