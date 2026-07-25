import { ApiEntry, Callout, CodeBlock, ContractList, DocPage } from '../components/doc-page'

export function ApplicationApiPage() {
  return (
    <DocPage
      boundary="application"
      description="제품 코드는 scope가 제공하는 다섯 메서드로 modal interaction을 열고 닫습니다."
      eyebrow="API REFERENCE"
      title="Application API"
    >
      <ApiEntry
        id="scope"
        name="createOverlayScope"
        returns="OverlayScope<Requests>"
        purpose="앱의 request 타입과 Provider·Hook·client를 한 경계로 생성"
        signature="createOverlayScope<Requests>(): OverlayScope<Requests>"
      >
        <CodeBlock>
          {`const appOverlay = createOverlayScope<{
  alert: AppAlertRequest
  confirm: AppConfirmRequest
}>()

export const useOverlay = appOverlay.useOverlay`}
        </CodeBlock>
        <p>
          Alert·Confirm의 표시 필드는 앱이 정합니다. Core 예약 behavior인 <code>onAction</code>,{' '}
          <code>onConfirm</code>과 Confirm의 close options는 자동으로 결합됩니다.
        </p>
      </ApiEntry>

      <ApiEntry
        id="alert"
        name="alert"
        returns={<code>OverlayHandle&lt;void&gt;</code>}
        purpose="내용을 인지하고 닫는 단일 action"
        signature="overlay.alert(request: AlertRequest): OverlayHandle<void>"
      >
        <CodeBlock>{`await overlay.alert({
  title: '저장했습니다.',
  actionLabel: '확인',
  onAction: () => trackNotice(),
})`}</CodeBlock>
        <p>
          Renderer는 <code>action()</code>을 호출합니다. Core는 호출부의 <code>onAction</code>을
          실행하고 즉시 닫습니다. Alert action은 비동기 pending UX를 제공하지 않습니다.
        </p>
      </ApiEntry>

      <ApiEntry
        id="confirm"
        name="confirm"
        returns={<code>OverlayHandle&lt;boolean&gt;</code>}
        purpose="취소와 진행을 선택하고 확인 작업을 관리"
        signature="overlay.confirm(request: ConfirmRequest): OverlayHandle<boolean>"
      >
        <CodeBlock>{`const confirmed = await overlay.confirm({
  title: '프로젝트를 삭제할까요?',
  tone: 'danger',
  onConfirm: () => deleteProject(),
  closeOnEscape: false,
})`}</CodeBlock>
        <p>
          Renderer의 <code>confirm()</code>이 호출부의 <code>onConfirm</code>을 실행합니다.
          Promise가 진행되는 동안 중복 확인·취소·ESC·outside를 막고, 실패하면 error 상태로 열린 채
          유지해 같은 action을 다시 시도할 수 있습니다. 성공은 true, 취소와 외부 닫기는 false입니다.
        </p>
        <Callout title="onCancel은 앱 request 필드로 확장합니다">
          Core는 취소 후 실행할 작업을 예약하지 않습니다. 필요하면 scope의 Confirm request에{' '}
          <code>onCancel</code>을 추가하고 Renderer가 이를 호출한 뒤 <code>cancel()</code>을
          호출합니다.
        </Callout>
      </ApiEntry>

      <ApiEntry
        id="open"
        name="open"
        returns={<code>OverlayHandle&lt;OverlayOutcome&lt;Result&gt;&gt;</code>}
        purpose="임의 JSX로 항상 새 custom overlay를 생성"
        signature="overlay.open<Result = void>(element: ReactElement, options?): OverlayHandle<OverlayOutcome<Result>>"
      >
        <CodeBlock>{`const outcome = await overlay.open<ProjectResult>(
  <ProjectEditor projectId={projectId} />,
  { closeOnEscape: true, closeOnOutsidePress: false },
)`}</CodeBlock>
        <p>
          Dialog, Sheet, BottomSheet, Drawer와 fullscreen modal을 모두 이 메서드로 엽니다. 전달한
          JSX와 props는 호출 시점 snapshot입니다. 결과 타입은 컴포넌트 안의{' '}
          <code>useOverlaySession&lt;Result&gt;()</code>과 맞춥니다.
        </p>
      </ApiEntry>

      <ApiEntry
        id="close"
        name="close"
        returns={<code>boolean</code>}
        purpose="현재 client에서 가장 나중에 열린 세션 종료"
        signature="overlay.close(reason?: OverlayCloseReason): boolean"
      >
        <p>
          LIFO stack의 topmost 세션을 닫습니다. reason 기본값은 <code>programmatic</code>입니다.
          특정 호출이 연 세션을 닫으려면 <code>handle.close()</code>를 사용합니다.
        </p>
      </ApiEntry>

      <ApiEntry
        id="close-all"
        name="closeAll"
        returns={<code>void</code>}
        purpose="현재 client의 모든 세션 종료"
        signature="overlay.closeAll(reason?: OverlayCloseReason): void"
      >
        <CodeBlock>{`overlay.closeAll('route-change')`}</CodeBlock>
        <p>로그아웃이나 route 전환처럼 열린 modal interaction을 한꺼번에 정리할 때 사용합니다.</p>
      </ApiEntry>
    </DocPage>
  )
}

export function RendererApiPage() {
  return (
    <DocPage
      boundary="renderer"
      description="앱 소유 Renderer는 Core가 제공한 action과 session lifecycle을 UI primitive에 연결합니다."
      eyebrow="API REFERENCE"
      title="Renderer API"
    >
      <ApiEntry
        id="managed-renderers"
        name="AlertRendererProps · ConfirmRendererProps"
        returns="관리형 recipe renderer 계약"
        purpose="Alert·Confirm의 공통 UX를 앱 UI에 연결"
        signature="<appOverlay.OverlayProvider renderers={{ alert, confirm }}>"
      >
        <ContractList>
          <li>
            Alert Renderer의 <code>action()</code>은 호출부 <code>onAction</code> 뒤 닫습니다.
          </li>
          <li>
            Confirm Renderer의 <code>confirm()</code>은 <code>onConfirm</code>과
            pending·error·retry를 관리합니다.
          </li>
          <li>
            <code>cancel()</code>은 false로 완료하고 닫습니다.
          </li>
          <li>
            호출부 callback에는 <code>on</code>, Renderer가 실행할 Core action에는 <code>on</code>을
            붙이지 않습니다.
          </li>
        </ContractList>
      </ApiEntry>

      <section className="api-entry" id="primitive-boundary">
        <div className="api-entry-heading">
          <h2>UI primitive와 Core의 경계</h2>
          <span>입력 감지는 UI가, 닫힘 결정은 Lyrd가 담당</span>
        </div>
        <CodeBlock label="EVENT FLOW">
          {`사용자가 ESC를 누름
→ Base UI·Radix·자체 UI가 입력을 감지
→ Renderer가 requestClose('escape') 호출
→ Lyrd가 topmost와 closeOnEscape 확인
→ 허용되면 closing으로 전환
→ UI의 exit가 끝나면 completeClose()`}
        </CodeBlock>
        <p>
          Lyrd는 전역 keydown이나 pointer listener를 설치하지 않습니다. 선택한 UI가 ESC와 outside
          press를 감지하고, 앱 Renderer가 그 사건을 Core에 전달합니다. Core는 어떤 UI 라이브러리를
          사용했는지 알지 못하며 React session과 닫힘 정책만 관리합니다.
        </p>
        <ContractList>
          <li>Base UI, Radix, shadcn 또는 자체 controlled modal을 사용할 수 있습니다.</li>
          <li>UI primitive는 입력 감지, focus, portal과 접근성을 담당합니다.</li>
          <li>
            Renderer adapter는 UI 사건을 <code>requestClose()</code>로 변환합니다.
          </li>
          <li>Lyrd는 topmost, close option, Promise 결과와 LIFO stack을 담당합니다.</li>
        </ContractList>
        <Callout title="자체 UI도 가능하지만 동작까지 자동 생성되지는 않습니다">
          자체 modal을 사용하면 ESC·outside 감지, focus trap과 복원, 배경 스크롤 방지, portal과 ARIA
          처리를 앱이 구현해야 합니다. 애니메이션이 없다면 closing을 확인한 즉시{' '}
          <code>completeClose()</code>를 호출합니다.
        </Callout>
      </section>

      <ApiEntry
        id="session-values"
        name="useOverlaySession"
        returns={<code>OverlaySession&lt;Result&gt;</code>}
        purpose="현재 custom JSX와 그 session을 연결"
        signature="useOverlaySession<Result>(): OverlaySession<Result>"
      >
        <CodeBlock>{`function ProjectEditor({ projectId }: Props) {
  const session = useOverlaySession<ProjectResult>()
  return <Dialog.Root open={session.open}>…</Dialog.Root>
}`}</CodeBlock>
        <p>
          <code>phase</code>는 opening·open·closing 중 하나입니다. Hook은{' '}
          <code>overlay.open()</code>으로 열린 element 안에서만 사용합니다.
        </p>
      </ApiEntry>

      <ApiEntry
        id="resolve"
        name="resolve"
        returns={<code>boolean</code>}
        purpose="값을 반환하며 종료 결정"
        signature="session.resolve(value: Result): boolean"
      >
        <CodeBlock>{`onSaved={(name) => session.resolve({ name })}`}</CodeBlock>
        <p>
          호출부에는 <code>{`{ status: 'resolved', value }`}</code>가 반환됩니다.
        </p>
      </ApiEntry>

      <ApiEntry
        id="close"
        name="close"
        returns={<code>boolean</code>}
        purpose="결과 없이 명시적으로 종료 결정"
        signature="session.close(reason?: OverlayCloseReason): boolean"
      >
        <CodeBlock>{`onCancel={() => session.close('cancel')}`}</CodeBlock>
        <p>취소 버튼처럼 Renderer가 이미 닫기로 결정한 action에 사용합니다.</p>
      </ApiEntry>

      <ApiEntry
        id="request-close"
        name="requestClose"
        returns={<code>boolean</code>}
        purpose="ESC·outside 시도를 정책과 topmost 판정에 전달"
        signature="session.requestClose(reason: 'escape' | 'outside'): boolean"
      >
        <CodeBlock>{`onOpenChange={(open, details) => {
  if (!open) {
    session.requestClose(
      details.reason === 'escape-key' ? 'escape' : 'outside',
    )
  }
}}`}</CodeBlock>
        <p>
          명시적 버튼 action에는 사용하지 않습니다. Core가 topmost 여부와 close option을 확인합니다.
        </p>
      </ApiEntry>

      <ApiEntry
        id="complete-close"
        name="completeClose"
        returns={<code>void</code>}
        purpose="exit가 끝난 session을 stack에서 제거"
        signature="session.completeClose(): void"
      >
        <CodeBlock>{`onOpenChangeComplete={(open) => {
  if (!open) session.completeClose()
}}`}</CodeBlock>
        <Callout title="닫힘 결정과 제거는 다릅니다">
          resolve·close·requestClose가 Promise 결과와 closing을 결정하고, completeClose는
          animation이 끝난 뒤 mount를 제거합니다.
        </Callout>
      </ApiEntry>
    </DocPage>
  )
}
