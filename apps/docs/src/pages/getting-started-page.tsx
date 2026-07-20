import { Callout, CodeBlock, DocPage } from '../components/doc-page'

export function GettingStartedPage() {
  return (
    <DocPage
      description="CLI로 앱이 직접 소유하는 Base UI renderer를 만들고 Provider를 연결한 다음, 기본 API와 typed overlay를 호출합니다."
      eyebrow="GETTING STARTED"
      title="첫 오버레이 열기"
    >
      <section id="install">
        <h2>1. Core와 CLI 사용 준비</h2>
        <p>
          권장 경로는 CLI를 한 번 실행하는 것입니다. CLI가 <code>@lyrd/core@next</code>와{' '}
          <code>@base-ui/react</code>를 설치하고 로컬 renderer 파일을 생성합니다.
        </p>
        <CodeBlock label="TERMINAL">pnpm dlx @lyrd/cli@next add overlay</CodeBlock>
        <p>Renderer 없이 Core 런타임만 직접 사용할 때는 별도로 설치할 수 있습니다.</p>
        <CodeBlock label="TERMINAL">pnpm add @lyrd/core@next</CodeBlock>
      </section>

      <section id="generate-renderer">
        <h2>2. 앱 소유 Renderer 확인</h2>
        <p>CLI는 기존 진입 파일을 덮어쓰지 않고 다음 파일을 애플리케이션 안에 생성합니다.</p>
        <CodeBlock label="GENERATED FILES">
          {`src/lyrd/overlay/
├─ alert.tsx
├─ confirm.tsx
├─ overlay-provider.tsx
└─ overlay.css`}
        </CodeBlock>
        <Callout title="App-owned UI">
          이 파일들은 패키지 내부 구현이 아닙니다. 제품의 디자인 시스템, 버튼, 오류 문구와
          animation에 맞춰 직접 수정하는 애플리케이션 코드입니다.
        </Callout>
      </section>

      <section id="connect-provider">
        <h2>3. Provider 연결</h2>
        <p>생성된 Provider를 앱 루트에서 한 번 연결합니다.</p>
        <CodeBlock label="APP ROOT">
          {`import { AppOverlayProvider } from './lyrd/overlay/overlay-provider'

root.render(
  <AppOverlayProvider>
    <App />
  </AppOverlayProvider>,
)`}
        </CodeBlock>
      </section>

      <section id="first-overlay">
        <h2>4. alert와 confirm 호출</h2>
        <CodeBlock label="APPLICATION">
          {`const overlay = useOverlay()

await overlay.alert({
  title: '저장했습니다.',
  acknowledgeLabel: '확인',
})

const confirmed = await overlay.confirm({
  title: '프로젝트를 삭제할까요?',
  description: '삭제한 프로젝트는 복구할 수 없습니다.',
  confirmLabel: '삭제',
  cancelLabel: '취소',
  tone: 'danger',
})

if (confirmed) deleteProject()`}
        </CodeBlock>
        <p>
          <code>alert()</code>는 사용자가 확인하면 완료되고, <code>confirm()</code>은 선택 결과를{' '}
          <code>boolean</code>으로 반환합니다.
        </p>
      </section>

      <section id="custom-overlay">
        <h2>5. defineOverlay와 open 사용</h2>
        <CodeBlock label="DEFINITION">
          {`type EditorInput = { documentId: string }
type EditorResult = { saved: true; title: string }

function DocumentEditor({ input, session }:
  OverlayDefinitionComponentProps<EditorInput, EditorResult>) {
  return (
    <Dialog.Root
      open={session.open}
      onOpenChange={(open) => {
        if (!open) session.requestDismiss('outside')
      }}
      onOpenChangeComplete={(open) => {
        if (!open) session.completeExit()
      }}
    >
      <Editor
        documentId={input.documentId}
        onCancel={() => session.dismiss('cancel')}
        onSaved={(title) => session.resolve({ saved: true, title })}
      />
    </Dialog.Root>
  )
}

const documentEditor = defineOverlay(DocumentEditor)`}
        </CodeBlock>
        <CodeBlock label="APPLICATION">
          {`const outcome = await overlay.open(documentEditor, {
  documentId: 'rfc-0003',
})

if (outcome.status === 'resolved') {
  console.log(outcome.value.title)
} else {
  console.log(outcome.reason)
}`}
        </CodeBlock>
        <p>
          <code>OverlayOutcome</code>은 값을 반환한 종료와 이유가 있는 dismiss를 구분합니다. 같은
          반환값을 보관하면 awaitable <code>OverlayHandle</code>로 세션을 갱신할 수도 있습니다.
        </p>
      </section>
    </DocPage>
  )
}
