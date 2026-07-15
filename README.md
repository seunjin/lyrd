# Lyrd

[문서와 인터랙티브 데모](https://seunjin.github.io/lyrd/) · [GitHub](https://github.com/seunjin/lyrd)

Base UI 기반 오버레이를 제품의 의도 단위로 중앙 관리하는 React 라이브러리다.

Lyrd은 Dialog, AlertDialog, Drawer 같은 접근성 프리미티브를 다시 구현하지 않는다. 애플리케이션이 소유한 Base UI 렌더러와 `overlay.alert()`, `overlay.confirm()` 호출 사이의 상태·결과·정책을 관리한다.

> Base UI는 동작의 기반을 제공하고, Lyrd은 제품에서 사용할 의미와 규칙을 관리한다.

## 현재 기능

- `overlay.alert()`: 내용을 인지하고 닫는 단일 확인 흐름
- `overlay.confirm()`: 취소 또는 진행을 결정하는 양자 선택 흐름
- 하나의 중앙 대기열과 `dedupeKey` 중복 방지
- 선택적 비동기 `onConfirm`의 pending·error·retry 상태
- 입력과 결과 타입을 연결하는 `defineOverlay()`, `overlay.open()`, `overlay.upsert()`
- Toast처럼 동시에 렌더링하는 오버레이를 위한 명시적 `parallel` group
- resolve와 dismiss 이유를 구분하는 `OverlayOutcome`
- 단발성 React element를 위한 `overlay.dialog()` escape hatch
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

생성된 definition은 typed session 수명주기를 연결하며, 앱이 모달·Drawer·풀페이지 등 원하는 형태로 수정한다.

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

반복 사용하는 커스텀 오버레이는 입력과 결과를 함께 정의한다.

~~~tsx
import { defineOverlay } from '@lyrd/core'
import type { OverlayDefinitionComponentProps } from '@lyrd/core'

type ProjectSettingsInput = { projectId: string }
type ProjectSettingsResult = { saved: true; projectName: string }

type ProjectSettingsOverlayProps = OverlayDefinitionComponentProps<
  ProjectSettingsInput,
  ProjectSettingsResult
>

function ProjectSettingsOverlay({ input, session }: ProjectSettingsOverlayProps) {
  return (
    <AppDrawer
      open={session.open}
      onOpenChange={(open) => !open && session.requestClose('outside')}
      onOpenChangeComplete={(open) => !open && session.completeClose()}
    >
      <ProjectSettingsForm
        projectId={input.projectId}
        onCancel={() => session.dismiss('cancel')}
        onSaved={(projectName) => session.resolve({ saved: true, projectName })}
      />
    </AppDrawer>
  )
}

export const projectSettings = defineOverlay(ProjectSettingsOverlay)
~~~

호출부에서는 definition으로부터 입력과 결과 타입을 함께 추론한다.

~~~tsx
const outcome = await overlay.open(projectSettings, { projectId })

if (outcome.status === 'resolved') {
  console.log(outcome.value.projectName)
} else {
  console.log(outcome.reason)
}
~~~

`alert()`와 `confirm()`은 각각 `void`와 `boolean`을 반환하는 간단한 기본 경로다. `OverlayOutcome`은 저장 결과와 dismiss 이유가 필요한 커스텀 오버레이에서 사용한다.

`overlay.open()`과 `overlay.dialog()`은 호출마다 독립 세션을 만든다. 진행률처럼 같은 작업의 입력을 갱신해야 할 때만 명시적인 identity로 `upsert()`를 사용한다.

~~~tsx
const upload = overlay.upsert(
  uploadProgress,
  uploadId,
  { uploadId, fileName, uploadedBytes: 0, totalBytes },
  { dismiss: 'block' },
)

overlay.upsert(uploadProgress, uploadId, {
  uploadId,
  fileName,
  uploadedBytes,
  totalBytes,
})

const outcome = await upload
~~~

같은 definition과 identity의 활성 세션은 Promise와 컴포넌트 인스턴스를 유지하면서 최신 input을 받는다. 다른 identity는 독립 세션이며, 완료 또는 dismiss되어 닫히는 세션은 재사용하지 않는다. 후속 호출에서 options를 생략하면 기존 options를 유지한다. `overlay.dialog(element)`와 `useOverlayDialog()`는 단발성 JSX와 기존 코드 마이그레이션을 위한 escape hatch로 유지한다.

Toast처럼 서로 기다리지 않아야 하는 오버레이는 정책을 한 번 선언해 호출할 때 선택한다.

~~~tsx
import { defineOverlayGroup } from '@lyrd/core'

const toastGroup = defineOverlayGroup({ strategy: 'parallel' })

const outcome = await overlay.open(
  appToast,
  { toastId, title: '저장했습니다.' },
  { group: toastGroup },
)
~~~

group을 생략한 `alert`, `confirm`, `open`은 기존의 안전한 modal queue를 유지한다. `parallel` group의 세션은 서로 독립적으로 열리고 닫히며 modal queue를 막지 않는다. `dismissAll()`은 기본 queue와 parallel group을 함께 정리한다. 첫 group API는 실제 Toast에 필요한 `parallel`만 제공하며, `replace`와 별도 queue group은 구체적인 사용 사례가 생길 때 추가한다.

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

`@lyrd/core`와 `@lyrd/cli`는 Changesets로 독립 버전을 관리한다. 두 패키지의 첫 공개 기준선은 `0.1.0`이다. npm 배포는 의도적으로 수동 GitHub Actions 워크플로와 환경 승인을 거치며, npm Trusted Publishing을 사용해 provenance를 남긴다. 실제 배포 전 준비와 절차는 [npm 배포 가이드](PUBLISHING.md)를 참고한다.

설계 결정은 [오버레이 의도 관리 시스템 RFC](docs/rfcs/0001-overlay-intent-system.md)에 기록한다.

typed definition과 정책 계층 방향은 [오버레이 정의와 정책 계층 RFC](docs/rfcs/0003-overlay-definition-and-policy-layers.md)에 기록한다.

## 라이선스

MIT
