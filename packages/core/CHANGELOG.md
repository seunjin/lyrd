# @lyrd/core

## 0.1.0-next.1

### Minor Changes

- b562af2: 입력과 결과 타입을 연결하는 `defineOverlay()`와 `overlay.open()`을 추가하고, 커스텀
  오버레이의 resolve와 dismiss 이유를 `OverlayOutcome`으로 구분합니다. Dialog 생성
  템플릿은 typed session 기반 definition을 생성하며, 기존 `overlay.dialog()`의 암묵적인
  React type/key 중복 공유는 제거합니다.
- 132c23b: Add identity-based `overlay.upsert()` for updating an active typed overlay while preserving its Promise and component instance.
- dbce7dc: Add explicit parallel overlay groups for rendering independent typed sessions alongside the default modal queue.

## 0.1.0-next.0

### Minor Changes

- 67d266d: `overlay.alert`, `overlay.confirm`, `overlay.dialog`, `OverlayProvider`, `useOverlay`를 포함한 첫 공개 런타임 `0.1.0`을 준비합니다.

### Patch Changes

- 095595b: 오버레이를 닫힌 상태로 먼저 마운트한 뒤 열어 Base UI의 진입 애니메이션 상태가 동작하도록 합니다.
- 3a062b9: TypeScript 7 네이티브 타입 검사와 TypeScript 6 compiler API 호환 구성을 병행합니다.
- npm 패키지의 문서, 라이선스, 저장소 링크, Node 지원 범위와 provenance 설정을 보완합니다.
