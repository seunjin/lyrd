# @lyrd/cli

## 0.1.0-next.3

### Patch Changes

- Print Toast runtime imports relative to the actual Vite app root or Next.js client provider file, including custom overlay paths.

## 0.1.0-next.2

### Patch Changes

- Refine the app-owned Toast starter with optional actions, generated notify helpers, correct limited styling, Fast Refresh-safe file boundaries, and dismissed outcomes for non-action closure.

## 0.1.0-next.1

### Minor Changes

- b562af2: 입력과 결과 타입을 연결하는 `defineOverlay()`와 `overlay.open()`을 추가하고, 커스텀
  오버레이의 resolve와 dismiss 이유를 `OverlayOutcome`으로 구분합니다. Dialog 생성
  템플릿은 typed session 기반 definition을 생성하며, 기존 `overlay.dialog()`의 암묵적인
  React type/key 중복 공유는 제거합니다.

### Patch Changes

- 91023ac: Add an app-owned Base UI Toast starter with an explicit parallel overlay group.

## 0.1.0-next.0

### Minor Changes

- 53d0a52: Base UI 로컬 오버레이 렌더러와 Provider, 개별 Dialog 시작 파일을 생성하는 첫 공개 CLI를 준비합니다.

### Patch Changes

- 67d266d: Vite의 실제 진입 파일을 안내하고, Next App Router용 로컬 클라이언트 Provider 파일을 안전하게 생성합니다.
- 3a062b9: TypeScript 7 네이티브 타입 검사와 TypeScript 6 compiler API 호환 구성을 병행합니다.
- npm 패키지의 문서, 라이선스, 저장소 링크, Node 지원 범위와 provenance 설정을 보완합니다.
