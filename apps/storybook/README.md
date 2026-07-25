# Overlay Storybook

`apps/storybook`은 Lyrd vNext 오버레이의 내부 행동 검증 환경이다.

## 검증 범위

- 앱 전용 `createOverlayScope()`와 로컬 Alert·Confirm renderer
- Alert action과 명시적인 programmatic close
- Confirm 확인·취소, pending·error·retry 상태
- Alert, Confirm과 custom JSX가 공유하는 LIFO stack
- `overlay.open(<JSX />)`의 모달·풀페이지 UI와 typed custom result
- 중첩 Dialog·Confirm과 아래 컴포넌트 state 유지
- `close()`, `handle.close()`, `closeAll()`과 exit 완료 lifecycle

## 구조

~~~text
.storybook/
  main.ts
  preview.tsx

src/
  preview.css
  stories/
    overlay-alert.stories.tsx
    overlay-confirm.stories.tsx
    overlay-dialog.stories.tsx
    overlay-lifecycle.stories.tsx
  overlays/
    OverlayProvider.tsx
    alert/
      AlertSurface.tsx
      Alert.module.css
    confirm/
      ConfirmSurface.tsx
      Confirm.module.css
    scope.ts
    dialogs/
      project-settings/
      document-editor/
~~~

`src/overlays`는 CLI가 사용자 프로젝트에 생성하는 로컬 코드의 검증 기준이다. 코어는 이 JSX나 스타일을 소유하지 않는다.

## 명령어

~~~bash
pnpm dev:storybook
pnpm build:storybook
~~~
