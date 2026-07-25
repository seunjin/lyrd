import { Callout, CodeBlock, ContractList, DocPage } from '../components/doc-page'

export function CustomOverlayRecipePage() {
  return (
    <DocPage
      description="Dialog, Sheet, BottomSheet와 fullscreen modal은 별도 Core 메서드 없이 JSX로 직접 엽니다."
      eyebrow="RECIPE"
      title="Custom overlay 열기"
    >
      <section id="component">
        <h2>1. 앱 컴포넌트에서 session 연결</h2>
        <CodeBlock label="PROJECT EDITOR">
          {`type ProjectResult = { name: string }

function ProjectEditor({ projectId }: { projectId: string }) {
  const session = useOverlaySession<ProjectResult>()
  const [name, setName] = useState('')

  return (
    <Dialog.Root
      open={session.open}
      onOpenChange={(open, details) => {
        if (!open) session.requestClose(
          details.reason === 'escape-key' ? 'escape' : 'outside',
        )
      }}
      onOpenChangeComplete={(open) => {
        if (!open) session.completeClose()
      }}
    >
      <ProjectForm
        name={name}
        onNameChange={setName}
        onCancel={() => session.close('cancel')}
        onSave={() => session.resolve({ name })}
      />
    </Dialog.Root>
  )
}`}
        </CodeBlock>
      </section>

      <section id="open">
        <h2>2. JSX를 열고 결과 기다리기</h2>
        <CodeBlock label="APPLICATION">
          {`const outcome = await overlay.open<ProjectResult>(
  <ProjectEditor projectId={projectId} />,
)

if (outcome.status === 'resolved') {
  updateProjectName(outcome.value.name)
} else if (outcome.reason === 'cancel') {
  // 사용자가 취소 버튼을 눌렀습니다.
}`}
        </CodeBlock>
        <ContractList>
          <li>컴포넌트 props는 JSX에서 평소처럼 타입 검사됩니다.</li>
          <li>
            Result 제네릭은 <code>useOverlaySession&lt;Result&gt;()</code>과 맞춥니다.
          </li>
          <li>호출할 때마다 독립된 새 session을 stack 위에 엽니다.</li>
        </ContractList>
      </section>

      <section id="state">
        <h2>3. 변하는 상태는 열린 컴포넌트가 소유</h2>
        <p>
          전달한 JSX는 호출 시점 snapshot입니다. input, step, loading 같은 UI state는 컴포넌트
          내부에서 관리합니다. 서버 데이터가 바뀌어야 한다면 <code>projectId</code> 같은 안정적인
          식별자로 query나 외부 store를 구독합니다.
        </p>
        <Callout title="열린 props를 다시 주입하지 않습니다">
          React의 일반 state 소유권을 유지합니다. 서로 다른 사용자 상호작용이면 새로운 overlay를
          여세요.
        </Callout>
      </section>
    </DocPage>
  )
}

export function NestedConfirmRecipePage() {
  return (
    <DocPage
      description="열린 editor 위에 Confirm을 올려도 아래 session은 mount와 state를 유지합니다."
      eyebrow="RECIPE"
      title="Custom overlay 안에서 Confirm 열기"
    >
      <section id="flow">
        <h2>1. 중첩 흐름</h2>
        <CodeBlock label="EDITOR">
          {`async function requestDelete() {
  const confirmed = await overlay.confirm({
    title: '이 프로젝트를 삭제할까요?',
    tone: 'danger',
  })

  if (confirmed) session.resolve({ action: 'delete' })
}`}
        </CodeBlock>
        <p>
          Confirm은 editor 위에 push됩니다. 취소하면 Confirm만 먼저 닫히고 editor의 입력값은 그대로
          남습니다. 이것이 LIFO stack의 기본 동작입니다.
        </p>
      </section>

      <section id="pending">
        <h2>2. 비동기 확인 작업</h2>
        <CodeBlock label="MANAGED CONFIRM">
          {`const deleted = await overlay.confirm({
  title: '삭제할까요?',
  onConfirm: () => deleteProject(projectId),
})`}
        </CodeBlock>
        <p>
          <code>onConfirm</code>이 pending인 동안 모든 종료 입력을 막습니다. 실패하면 Confirm이 열린
          상태로 error를 표시하고 Renderer의 같은 <code>confirm()</code>으로 재시도합니다.
        </p>
      </section>

      <section id="cancel-action">
        <h2>3. 취소 side effect가 필요할 때</h2>
        <CodeBlock label="APP REQUEST AND RENDERER">
          {`type AppConfirmRequest = {
  title: ReactNode
  onCancel?: () => void
}

function handleCancel() {
  request.onCancel?.()
  cancel()
}`}
        </CodeBlock>
        <p>
          <code>onCancel</code>은 Core 예약 필드가 아닙니다. 제품에서 필요할 때 request 타입과
          Renderer에 명시적으로 추가합니다. 단순 취소는 내장 <code>cancel()</code>만 사용합니다.
        </p>
      </section>
    </DocPage>
  )
}
