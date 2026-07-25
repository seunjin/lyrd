import { Callout, CodeBlock, DocPage } from '../components/doc-page'

export function GettingStartedPage() {
  return (
    <DocPage
      description="CLI로 앱 소유 scope와 Base UI renderer를 만들고 Alert, Confirm, custom overlay를 엽니다."
      eyebrow="GETTING STARTED"
      title="첫 오버레이 열기"
    >
      <section id="install">
        <h2>1. 설치</h2>
        <CodeBlock label="TERMINAL">{`pnpm dlx @lyrd/cli init
pnpm dlx @lyrd/cli add overlay`}</CodeBlock>
        <p>
          CLI는 <code>@lyrd/core</code>와 <code>@base-ui/react</code>를 설치합니다. Core만 직접
          구성하려면 <code>pnpm add @lyrd/core</code>를 사용합니다.
        </p>
      </section>

      <section id="generate-renderer">
        <h2>2. 앱 소유 Renderer 확인</h2>
        <CodeBlock label="GENERATED FILES">
          {`src/overlays/
├─ scope.ts
├─ OverlayProvider.tsx
├─ index.ts
├─ alert/AlertSurface.tsx
└─ confirm/ConfirmSurface.tsx`}
        </CodeBlock>
        <p>
          <code>scope.ts</code>의 request 타입에 title, tone처럼 제품에 필요한 표시 필드를
          정의합니다. 생성 파일은 패키지 내부가 아니라 수정 가능한 애플리케이션 코드입니다.
        </p>
      </section>

      <section id="connect-provider">
        <h2>3. Provider 연결</h2>
        <CodeBlock label="APPLICATION ROOT">
          {`import { OverlayProvider } from './overlays'

root.render(
  <OverlayProvider>
    <App />
  </OverlayProvider>,
)`}
        </CodeBlock>
        <Callout title="Scope와 Hook은 한 쌍입니다">
          호출부는 Core의 전역 Hook이 아니라 생성된 <code>useOverlay</code>를 import합니다. 이
          Hook의 request 타입은 같은 scope에서 추론됩니다.
        </Callout>
      </section>

      <section id="first-overlay">
        <h2>4. Alert와 Confirm</h2>
        <CodeBlock label="APPLICATION">
          {`const overlay = useOverlay()

await overlay.alert({
  title: '저장했습니다.',
  actionLabel: '확인',
  onAction: () => trackSavedNotice(),
})

const confirmed = await overlay.confirm({
  title: '프로젝트를 삭제할까요?',
  tone: 'danger',
  onConfirm: () => deleteProject(),
})`}
        </CodeBlock>
        <p>
          Alert의 <code>onAction</code>은 동기 side effect를 실행하고 바로 닫습니다. Confirm의{' '}
          <code>onConfirm</code>은 동기·비동기 작업을 지원하며, Core가 pending과 실패 후 retry를
          관리합니다.
        </p>
      </section>

      <section id="custom-overlay">
        <h2>5. Custom overlay</h2>
        <CodeBlock label="APPLICATION">
          {`const outcome = await overlay.open<ProjectResult>(
  <ProjectEditor projectId={projectId} />,
)

if (outcome.status === 'resolved') {
  console.log(outcome.value)
} else {
  console.log(outcome.reason)
}`}
        </CodeBlock>
        <p>
          Dialog, Sheet, BottomSheet, Drawer와 fullscreen modal 모두 JSX를 직접 전달합니다. 컴포넌트
          내부에서는 <code>useOverlaySession&lt;ProjectResult&gt;()</code>을 사용합니다.
        </p>
      </section>

      <section id="next-choice">
        <h2>6. 다음 선택</h2>
        <CodeBlock label="OPTIONAL DIALOG STARTER">
          pnpm dlx @lyrd/cli add dialog project-settings
        </CodeBlock>
        <p>
          CLI의 Dialog 명령은 <code>useOverlaySession()</code>이 연결된 JSX 시작점을 만듭니다.
          Toast는 Core와 CLI 범위에 포함되지 않으므로 앱의 기존 알림 시스템을 사용합니다.
        </p>
      </section>
    </DocPage>
  )
}
