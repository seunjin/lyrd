# Overlay Storybook

`apps/storybook`은 Lyrd vNext 오버레이의 내부 행동 검증 환경이다.

## 검증 범위

- `overlay.alert()` 인지 및 닫힘 흐름
- `overlay.confirm()` 확인·취소 결과
- 비동기 `onConfirm`의 pending·error·retry 상태
- `alert`와 `confirm`의 통합 대기열
- `dedupeKey` 중복 요청 병합
- `defineOverlay()`와 `overlay.open()`의 모달·풀페이지 로컬 UI
- 같은 definition을 여러 번 호출하는 독립 세션 대기열
- 업로드 identity별 `upsert()` Promise 재사용과 실시간 input 갱신
- typed session의 결과·dismiss 이유·닫힘 완료 연결
- 앱 로컬 Base UI 렌더러와 `@lyrd/core`의 연결

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
    overlay-progress.stories.tsx
  lyrd/
    alert.tsx
    confirm.tsx
    dialog.css
    dialogs/
      project-settings-dialog.tsx
      document-editor-dialog.tsx
      upload-progress-dialog.tsx
    overlay.css
~~~

`src/lyrd`은 CLI가 사용자 프로젝트에 생성하는 로컬 코드의 검증 기준이다. 코어는 이 JSX나 스타일을 소유하지 않는다.

## 명령어

~~~bash
pnpm dev:storybook
pnpm build:storybook
~~~
