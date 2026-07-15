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

사용법과 인터랙티브 데모는 [Lyrd 문서](https://seunjin.github.io/lyrd/)에서 확인할 수 있다.
