# Lyrd

[문서](https://seunjin.github.io/lyrd/) ·
[Quickstart](https://seunjin.github.io/lyrd/getting-started) ·
[Playground](https://seunjin.github.io/lyrd/playground) ·
[Troubleshooting](https://seunjin.github.io/lyrd/troubleshooting)

Lyrd는 애플리케이션이 소유한 modal UI와 제품 코드 사이에서 요청, Promise 결과, LIFO stack과
닫힘 lifecycle을 관리하는 React 라이브러리다. Dialog, Sheet, BottomSheet 같은 UI와 스타일은
제공하지 않으며 앱 Renderer가 Base UI, Radix 또는 자체 UI를 연결한다.

## 설치

앱이 수정할 수 있는 scope, Provider와 Base UI Renderer를 CLI로 생성한다.

```bash
pnpm dlx @lyrd/cli add overlay --verbose
```

런타임만 직접 설치하려면 다음 명령을 사용한다.

```bash
pnpm add @lyrd/core
```

생성된 Provider를 Vite 또는 Next.js 앱에 연결하는 전체 과정은
[Quickstart](https://seunjin.github.io/lyrd/getting-started)에서 확인한다.

## 최소 예제

제품 코드는 생성된 앱 모듈의 `useOverlay`를 사용한다.

```tsx
const overlay = useOverlay()

const confirmed = await overlay.confirm({
  title: '프로젝트를 삭제할까요?',
  confirmLabel: '삭제',
  cancelLabel: '취소',
  onConfirm: () => deleteProject(),
})
```

Alert, custom JSX, 결과 타입과 Renderer 연결은 문서 앱을 현재 계약의 기준으로 삼는다.

- [Overview와 책임 경계](https://seunjin.github.io/lyrd/introduction)
- [Application API](https://seunjin.github.io/lyrd/api/application)
- [Renderer API](https://seunjin.github.io/lyrd/api/renderer)
- [Public types와 기본값](https://seunjin.github.io/lyrd/api/public-types)
- [실전 Recipes](https://seunjin.github.io/lyrd/recipes/custom-overlay)
- [LLM 가이드](https://seunjin.github.io/lyrd/llms.txt)

MIT
