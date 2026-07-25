---
"@lyrd/core": minor
"@lyrd/cli": minor
---

modal interaction에 집중한 새 Overlay API로 전환합니다.

- `createOverlayScope()`로 앱의 Alert·Confirm request 타입, Provider, Hook과 client를 함께 정의합니다.
- `alert()`와 `confirm()`은 앱 소유 Renderer를 사용하며 Confirm의 비동기 pending, error와 retry를 관리합니다.
- Dialog, Sheet, BottomSheet 등 custom modal은 `open(<Component />)`으로 열고 `useOverlaySession()`으로 결과와 close lifecycle을 연결합니다.
- 모든 modal은 LIFO stack을 공유하며 `close()`, `handle.close()`, `closeAll()`로 대상 범위를 구분합니다.
- definition, identity 기반 update, group·parallel scheduling, FIFO queue, dismiss 명칭과 Core Toast 통합을 제거합니다.
- CLI가 앱 전용 scope와 새 Renderer 계약을 생성하고 custom Dialog를 JSX로 직접 여는 시작점을 제공합니다.
