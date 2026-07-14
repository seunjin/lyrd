# @lyrd/core

제품의 alert, confirm, dialog 의도를 중앙에서 관리하는 Lyrd의 React 런타임이다.

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

사용법과 인터랙티브 데모는 [Lyrd 문서](https://seunjin.github.io/lyrd/)에서 확인할 수 있다.
