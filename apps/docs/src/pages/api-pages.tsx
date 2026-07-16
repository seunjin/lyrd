import { ApiEntry, Callout, CodeBlock, ContractList, DocPage } from '../components/doc-page'

export function ApplicationApiPage() {
  return (
    <DocPage
      boundary="application"
      description="제품 코드가 사용자 의도를 요청하는 표면입니다. Renderer lifecycle method와 분리해서 사용합니다."
      eyebrow="API REFERENCE"
      title="Application API"
    >
      <ApiEntry
        id="alert"
        name="alert"
        returns={<code>Promise&lt;void&gt;</code>}
        purpose="내용을 인지하고 닫는 단일 확인 흐름"
        signature="overlay.alert(request: AlertRequest): Promise<void>"
      >
        <p>
          정보 전달이나 완료 알림처럼 선택지가 하나인 경우 사용합니다. <code>request</code>에는
          title, description, acknowledgeLabel과 선택적 dedupeKey를 전달합니다.
        </p>
        <CodeBlock>
          {`await overlay.alert({
  title: '배포 준비가 완료되었습니다.',
  description: '품질 게이트가 모두 통과했습니다.',
  acknowledgeLabel: '확인',
})`}
        </CodeBlock>
      </ApiEntry>

      <ApiEntry
        id="confirm"
        name="confirm"
        returns={<code>Promise&lt;boolean&gt;</code>}
        purpose="취소와 진행 중 하나를 선택하는 확인 흐름"
        signature="overlay.confirm(request: ConfirmRequest): Promise<boolean>"
      >
        <p>
          confirmLabel은 필수이며 cancelLabel, tone, dismissPolicy, dedupeKey와 비동기 onConfirm을
          선택적으로 지정합니다. 확인이 완료되면 true, 취소되면 false입니다.
        </p>
        <CodeBlock>
          {`const confirmed = await overlay.confirm({
  title: '프로젝트를 삭제할까요?',
  confirmLabel: '삭제',
  cancelLabel: '취소',
  tone: 'danger',
  dismissPolicy: 'block',
  onConfirm: () => deleteProject(projectId),
})`}
        </CodeBlock>
      </ApiEntry>

      <ApiEntry
        id="open"
        name="open"
        returns={<code>OverlayHandle&lt;Input, Result&gt;</code>}
        purpose="typed definition으로 항상 새 세션을 생성"
        signature="overlay.open(definition, input, options?): OverlayHandle<Input, Result>"
      >
        <p>
          definition이 선언한 Input과 Result 타입을 추론합니다. options에는 dismissPolicy와 선택적
          group을 지정합니다. 호출할 때마다 identity와 무관한 새 세션을 만듭니다.
        </p>
        <CodeBlock>
          {`const outcome = await overlay.open(
  projectSettings,
  { projectId },
  { dismissPolicy: 'block' },
)`}
        </CodeBlock>
        <Callout title="Handle을 보관할 수 있습니다">
          결과만 필요하면 바로 await합니다. 같은 활성 세션의 input을 갱신해야 하면 직접 반환된
          Handle을 보관하고 <code>handle.update(nextInput)</code>을 호출합니다.
        </Callout>
      </ApiEntry>

      <ApiEntry
        id="open-or-update"
        name="openOrUpdate"
        returns={<code>OverlayHandle&lt;Input, Result&gt;</code>}
        purpose="definition과 업무 identity로 활성 세션을 찾거나 생성"
        signature="overlay.openOrUpdate(definition, identity, input, options?): OverlayHandle<Input, Result>"
      >
        <p>
          서로 떨어진 호출부가 uploadId 같은 안정적인 업무 identity로 같은 작업을 찾아야 할 때
          사용합니다. 한 로컬 흐름만 세션을 갱신한다면 반환된 Handle의 update가 더 직접적입니다.
        </p>
        <CodeBlock>
          {`const upload = overlay.openOrUpdate(
  uploadProgress,
  uploadId,
  initialInput,
  { dismissPolicy: 'block' },
)

upload.update(nextInput)
const outcome = await upload`}
        </CodeBlock>
        <ContractList>
          <li>
            같은 definition과 identity의 활성 세션은 Handle과 컴포넌트 인스턴스를 재사용합니다.
          </li>
          <li>활성 세션이 없으면 새 세션을 생성합니다.</li>
          <li>활성 세션의 group은 변경할 수 없습니다.</li>
          <li>종료된 identity를 다시 호출하면 새 세션을 만듭니다.</li>
        </ContractList>
      </ApiEntry>

      <ApiEntry
        id="dismiss-all"
        name="dismissAll"
        returns={<code>void</code>}
        purpose="기본 queue와 모든 parallel group을 함께 정리"
        signature="overlay.dismissAll(reason?: 'route-change' | 'programmatic'): void"
      >
        <p>
          route 전환이나 애플리케이션 단위 정리처럼 모든 활성·대기 세션을 함께 종료해야 할 때
          사용합니다. reason을 생략하면 programmatic으로 처리합니다.
        </p>
        <CodeBlock>{`overlay.dismissAll('route-change')`}</CodeBlock>
      </ApiEntry>

      <section id="types-and-definitions">
        <h2>Types와 definitions</h2>
        <div className="api-type-grid">
          <article>
            <h3>OverlayHandle</h3>
            <p>
              실제 Promise에 <code>update(input)</code>과 <code>dismiss(reason?)</code>을 더한 활성
              세션 제어 객체입니다. 종료 후 두 메서드는 false를 반환합니다.
            </p>
          </article>
          <article>
            <h3>OverlayOutcome</h3>
            <p>
              <code>resolved</code>의 value와 <code>dismissed</code>의 reason을 판별 가능한
              union으로 구분합니다.
            </p>
          </article>
          <article>
            <h3>defineOverlay</h3>
            <p>
              Renderer component의 Input과 Result 타입을 하나의 재사용 가능한 definition으로
              연결합니다.
            </p>
          </article>
          <article>
            <h3>defineOverlayGroup</h3>
            <p>
              <code>{`{ strategy: 'parallel' }`}</code>로 독립 coordination boundary를 선언합니다.
            </p>
          </article>
        </div>
        <CodeBlock label="DEFINITIONS">
          {`const projectSettings = defineOverlay(ProjectSettingsOverlay)

const toastGroup = defineOverlayGroup({
  strategy: 'parallel',
})`}
        </CodeBlock>
      </section>
    </DocPage>
  )
}

export function RendererApiPage() {
  return (
    <DocPage
      boundary="renderer"
      description="앱 소유 Renderer가 Base UI나 Radix 같은 primitive의 이벤트를 Lyrd 세션에 연결하는 표면입니다. 일반 제품 호출부에서 사용하지 않습니다."
      eyebrow="API REFERENCE"
      title="Renderer API"
    >
      <Callout title="Application API와 분리하세요">
        제품 코드는 <code>overlay.open()</code> 같은 Application API를 호출합니다. Renderer
        component만 <code>session.resolve()</code>와 lifecycle method를 UI primitive에 연결합니다.
      </Callout>

      <ApiEntry
        id="session-values"
        name="open · status"
        returns="현재 세션 상태"
        purpose="primitive의 controlled state와 시각 상태를 동기화"
        signature="session.open: boolean\nsession.status: 'mounting' | 'open' | 'pending' | 'error' | 'closing'"
      >
        <p>
          <code>open</code>은 Dialog.Root 같은 controlled primitive에 전달합니다.{' '}
          <code>status</code>는 mounting·open·closing과 confirm의 pending·error 표현에 사용합니다.
        </p>
        <CodeBlock>{`<Dialog.Root open={session.open}>…</Dialog.Root>`}</CodeBlock>
      </ApiEntry>

      <ApiEntry
        id="resolve"
        name="resolve"
        returns={<code>void</code>}
        purpose="값을 반환하며 종료를 확정"
        signature="session.resolve(value: Result): void"
      >
        <p>
          저장이나 선택이 성공해 호출부에 typed 결과를 돌려줄 때 사용합니다. 최종 outcome은{' '}
          <code>{`{ status: 'resolved', value }`}</code>입니다.
        </p>
        <CodeBlock>{`onSaved={(name) => session.resolve({ name })}`}</CodeBlock>
      </ApiEntry>

      <ApiEntry
        id="dismiss"
        name="dismiss"
        returns={<code>void</code>}
        purpose="결과 값 없이 종료를 확정"
        signature="session.dismiss(reason: OverlayDismissReason): void"
      >
        <p>
          취소 버튼처럼 Renderer가 이미 종료하기로 결정한 명시적 action에 사용합니다. 이는 외부
          dismiss 시도인 requestDismiss와 대체 관계가 아닙니다.
        </p>
        <CodeBlock>{`onCancel={() => session.dismiss('cancel')}`}</CodeBlock>
      </ApiEntry>

      <ApiEntry
        id="request-dismiss"
        name="requestDismiss"
        returns={<code>void</code>}
        purpose="ESC·outside 같은 외부 dismiss 시도를 policy에 전달"
        signature="session.requestDismiss(reason: OverlayDismissReason): void"
      >
        <p>
          UI primitive가 닫기를 시도할 때 사용합니다. 런타임은 현재 dismissPolicy를 확인해 요청을
          허용하거나 거절합니다.
        </p>
        <CodeBlock>
          {`onOpenChange={(open, details) => {
  if (!open) {
    session.requestDismiss(
      details.reason === 'escape-key' ? 'escape' : 'outside',
    )
  }
}}`}
        </CodeBlock>
      </ApiEntry>

      <ApiEntry
        id="complete-exit"
        name="completeExit"
        returns={<code>void</code>}
        purpose="exit lifecycle이 끝났음을 런타임에 알림"
        signature="session.completeExit(): void"
      >
        <p>
          closing transition이 끝난 뒤 호출합니다. 런타임은 이 신호를 받은 후 세션을 최종 제거하고
          다음 queue 항목을 진행할 수 있습니다.
        </p>
        <CodeBlock>
          {`onOpenChangeComplete={(open) => {
  if (!open) session.completeExit()
}}`}
        </CodeBlock>
      </ApiEntry>

      <section className="renderer-summary">
        <h2>의미를 한 줄로 구분하기</h2>
        <div className="meaning-table">
          <div>
            <strong>dismiss</strong>
            <span>종료하기로 확정</span>
          </div>
          <div>
            <strong>requestDismiss</strong>
            <span>외부 dismiss 시도를 정책에 전달</span>
          </div>
          <div>
            <strong>completeExit</strong>
            <span>exit lifecycle 완료를 알림</span>
          </div>
        </div>
      </section>
    </DocPage>
  )
}
