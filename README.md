# Lyrd

Base UI 기반 오버레이를 제품의 의도 단위로 중앙 관리하는 React 라이브러리다.

Lyrd은 Dialog, AlertDialog, Drawer 같은 접근성 프리미티브를 다시 구현하지 않는다. 애플리케이션이 소유한 Base UI 렌더러와 `overlay.alert()`, `overlay.confirm()` 호출 사이의 상태·결과·정책을 관리한다.

> Base UI는 동작의 기반을 제공하고, Lyrd은 제품에서 사용할 의미와 규칙을 관리한다.

## 현재 기능

- `overlay.alert()`: 내용을 인지하고 닫는 단일 확인 흐름
- `overlay.confirm()`: 취소 또는 진행을 결정하는 양자 선택 흐름
- 하나의 중앙 대기열과 `dedupeKey` 중복 방지
- 선택적 비동기 `onConfirm`의 pending·error·retry 상태
- 임의의 앱 React UI를 여는 `overlay.dialog()`와 Promise 기반 결과 반환
- 앱이 직접 소유하고 수정하는 Base UI 로컬 렌더러

## 설치

~~~bash
pnpm dlx @lyrd/cli add overlay
~~~

이 명령은 `@lyrd/core`와 `@base-ui/react`를 설치하고 다음 파일을 생성한다.

~~~text
src/lyrd/overlay/
  alert.tsx
  confirm.tsx
  overlay-provider.tsx
  overlay.css
~~~

생성된 파일은 애플리케이션 코드다. Lyrd은 파일을 자동으로 덮어쓰지 않으며 JSX, 스타일, 버튼, 오류 표현을 자유롭게 수정할 수 있다.

Vite 프로젝트에서는 CLI가 실제 `src/main.tsx` 또는 `src/main.jsx`에 넣을 Provider 연결 코드를 안내한다. Next App Router에서는 `app/lyrd-overlay-provider.tsx`(또는 `src/app/...`) 클라이언트 연결 파일을 생성하고, `layout.tsx`에 추가할 코드만 안내한다. 어떤 경우에도 기존 앱 진입 파일은 자동으로 수정하지 않는다.

생성 파일을 앱의 디자인 시스템과 기존 확인창에 연결하는 방법은 [로컬 오버레이 렌더러 커스터마이징 cookbook](docs/cookbook/local-overlay-renderer.md)을 참고한다.

개별 범용 Dialog 시작 파일은 Overlay 설치 후 다음 명령으로 추가한다.

~~~bash
pnpm dlx @lyrd/cli add dialog project-settings
~~~

생성된 컴포넌트는 `useOverlayDialog()` 수명주기를 연결하며, 앱이 모달·Drawer·풀페이지 등 원하는 형태로 수정한다.

## 사용

~~~tsx
import { useOverlay } from '@lyrd/core'

function DeleteProjectButton() {
  const overlay = useOverlay()

  async function deleteProject() {
    const confirmed = await overlay.confirm({
      title: '프로젝트를 삭제할까요?',
      description: '삭제한 프로젝트는 복구할 수 없습니다.',
      confirmLabel: '삭제',
      cancelLabel: '취소',
      tone: 'danger',
      onConfirm: async () => {
        await requestProjectDeletion()
      },
    })

    if (!confirmed) return
  }

  return <button onClick={deleteProject}>삭제</button>
}
~~~

`overlay.dialog()`는 Base UI·Radix·커스텀 UI를 강제하지 않는 범용 오버레이 세션이다. 열린 컴포넌트 안에서는 `useOverlayDialog()`로 결과를 반환하거나 닫힘 생명주기를 연결한다. 계약과 예시는 [범용 Dialog 세션 RFC](docs/rfcs/0002-registered-overlay-contract.md)를 참고한다.

같은 컴포넌트 타입과 React `key`로 호출한 Dialog는 자동으로 기존 Promise를 공유하므로 별도 중복 방지 ID를 입력할 필요가 없다. 같은 컴포넌트의 서로 다른 인스턴스가 필요할 때만 JSX의 `key`를 지정한다.

앱 루트에는 CLI가 생성한 `AppOverlayProvider`를 한 번 연결한다.

## 패키지

| 패키지 | 역할 |
| --- | --- |
| `@lyrd/core` | 오버레이 요청, Promise 결과, 대기열과 상태 관리 |
| `@lyrd/cli` | Base UI 기반 로컬 렌더러와 Provider 생성 |

Lyrd는 기존 Woon 컴포넌트 라이브러리와 별도 제품이다. 이전 Woon 구현은 해당 저장소와 릴리스에서 계속 유지한다.

## 개발

~~~bash
pnpm dev
pnpm typecheck
pnpm test
pnpm build
pnpm build:storybook
pnpm test:package
~~~

PR과 `main` 브랜치 변경에는 GitHub Actions 품질 게이트가 실행된다. 린트, 타입 검사, 테스트, 패키지와 Storybook 빌드, 실제 CLI 배포물 설치 검증이 모두 통과해야 한다.

## 배포

`@lyrd/core`와 `@lyrd/cli`는 Changesets로 독립 버전을 관리한다. 첫 공개 기준선은 각각 `0.1.0`, `0.2.0`이다. npm 배포는 의도적으로 수동 GitHub Actions 워크플로와 환경 승인을 거치며, npm Trusted Publishing을 사용해 provenance를 남긴다. 실제 배포 전 준비와 절차는 [npm 배포 가이드](PUBLISHING.md)를 참고한다.

설계 결정은 [오버레이 의도 관리 시스템 RFC](docs/rfcs/0001-overlay-intent-system.md)에 기록한다.

MVP 이후 등록형 Dialog·Drawer·풀페이지 오버레이의 확장 방향은 [등록형 커스텀 오버레이 계약 RFC](docs/rfcs/0002-registered-overlay-contract.md)에 기록한다.

## 라이선스

MIT
