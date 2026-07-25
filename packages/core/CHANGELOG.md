# @lyrd/core

## 0.2.0

### Minor Changes

- 5d5579a: modal interaction에 집중한 새 Overlay API로 전환합니다.

  - `createOverlayScope()`로 앱의 Alert·Confirm request 타입, Provider, Hook과 client를 함께 정의합니다.
  - `alert()`와 `confirm()`은 앱 소유 Renderer를 사용하며 Confirm의 비동기 pending, error와 retry를 관리합니다.
  - Dialog, Sheet, BottomSheet 등 custom modal은 `open(<Component />)`으로 열고 `useOverlaySession()`으로 결과와 close lifecycle을 연결합니다.
  - 모든 modal은 LIFO stack을 공유하며 `close()`, `handle.close()`, `closeAll()`로 대상 범위를 구분합니다.
  - definition, identity 기반 update, group·parallel scheduling, FIFO queue, dismiss 명칭과 Core Toast 통합을 제거합니다.
  - CLI가 앱 전용 scope와 새 Renderer 계약을 생성하고 custom Dialog를 JSX로 직접 여는 시작점을 제공합니다.

## 0.2.0-next.0

### Minor Changes

- 5d5579a: modal interaction에 집중한 새 Overlay API로 전환합니다.

  - `createOverlayScope()`로 앱의 Alert·Confirm request 타입, Provider, Hook과 client를 함께 정의합니다.
  - `alert()`와 `confirm()`은 앱 소유 Renderer를 사용하며 Confirm의 비동기 pending, error와 retry를 관리합니다.
  - Dialog, Sheet, BottomSheet 등 custom modal은 `open(<Component />)`으로 열고 `useOverlaySession()`으로 결과와 close lifecycle을 연결합니다.
  - 모든 modal은 LIFO stack을 공유하며 `close()`, `handle.close()`, `closeAll()`로 대상 범위를 구분합니다.
  - definition, identity 기반 update, group·parallel scheduling, FIFO queue, dismiss 명칭과 Core Toast 통합을 제거합니다.
  - CLI가 앱 전용 scope와 새 Renderer 계약을 생성하고 custom Dialog를 JSX로 직접 여는 시작점을 제공합니다.

## 0.1.1

### Patch Changes

- 01650a7: 개발 모드에서 overlay exit 완료 신호가 장시간 누락되면 진단 경고를 제공하고, CLI가 Provider 연결·기존 파일·미지원 프로젝트 구조·설치 실패의 복구 방법을 더 명확히 안내합니다.

## 0.1.0

### Minor Changes

- e3f7184: 입력과 결과 타입을 연결하는 `defineOverlay()`와 `overlay.open()`을 추가하고, 커스텀
  오버레이의 resolve와 dismiss 이유를 `OverlayOutcome`으로 구분합니다. Dialog 생성
  템플릿은 typed session 기반 definition을 생성하며, 기존 `overlay.dialog()`의 암묵적인
  React type/key 중복 공유는 제거합니다.
- ff51351: Clarify the stable renderer contract by renaming external close requests to `requestDismiss`, exit completion to `completeExit`, and the application option to `dismissPolicy`. Store parallel sessions by overlay group identity so groups are real coordination boundaries rather than strategy wrappers.
- e3f7184: Add identity-based `overlay.upsert()` for updating an active typed overlay while preserving its Promise and component instance.
- f317427: Return an awaitable `OverlayHandle` from `open()` and `openOrUpdate()` so callers can update or dismiss one exact active session without losing the existing Promise-first API. Rename the identity-based `upsert()` API to `openOrUpdate()` to make its create-or-update behavior explicit.
- 67d266d: `overlay.alert`, `overlay.confirm`, `overlay.dialog`, `OverlayProvider`, `useOverlay`를 포함한 첫 공개 런타임 `0.1.0`을 준비합니다.
- e3f7184: Add explicit parallel overlay groups for rendering independent typed sessions alongside the default modal queue.

### Patch Changes

- 095595b: 오버레이를 닫힌 상태로 먼저 마운트한 뒤 열어 Base UI의 진입 애니메이션 상태가 동작하도록 합니다.
- 3a062b9: TypeScript 7 네이티브 타입 검사와 TypeScript 6 compiler API 호환 구성을 병행합니다.
- 7b2518b: npm 패키지의 문서, 라이선스, 저장소 링크, Node 지원 범위와 provenance 설정을 보완합니다.

## 0.1.0-next.3

### Minor Changes

- Return an awaitable `OverlayHandle` from `open()` and `openOrUpdate()` so callers can update or dismiss one exact active session without losing the existing Promise-first API. Rename the identity-based `upsert()` API to `openOrUpdate()` to make its create-or-update behavior explicit.

## 0.1.0-next.2

### Minor Changes

- Clarify the stable renderer contract by renaming external close requests to `requestDismiss`, exit completion to `completeExit`, and the application option to `dismissPolicy`. Store parallel sessions by overlay group identity so groups are real coordination boundaries rather than strategy wrappers.

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
