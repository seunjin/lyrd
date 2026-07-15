---
"@lyrd/core": minor
"@lyrd/cli": minor
---

입력과 결과 타입을 연결하는 `defineOverlay()`와 `overlay.open()`을 추가하고, 커스텀
오버레이의 resolve와 dismiss 이유를 `OverlayOutcome`으로 구분합니다. Dialog 생성
템플릿은 typed session 기반 definition을 생성하며, 기존 `overlay.dialog()`의 암묵적인
React type/key 중복 공유는 제거합니다.
