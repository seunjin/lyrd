---
'@lyrd/cli': minor
---

CSS Modules와 Tailwind CSS v4 생성 방식을 초기화 시 선택하도록 변경합니다. 생성 코드를 `src/overlays`의 기능별 폴더로 분리하고, `OverlayProvider` 네이밍과 독립적인 Base UI Toast manager/renderer 구성을 적용하며, Lyrd 전용 클래스와 기존 plain CSS 생성 계약을 제거합니다.
