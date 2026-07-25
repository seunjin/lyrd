import { Callout, CodeBlock, ContractList, DocPage } from '../components/doc-page'

export function OutcomeAndHandlePage() {
  return (
    <DocPage
      description="open()은 결과를 기다릴 수 있는 Promise이면서 정확한 세션을 닫을 수 있는 Handle을 반환합니다."
      eyebrow="CONCEPTS"
      title="Outcome과 awaitable Handle"
    >
      <section id="outcome">
        <h2>OverlayOutcome</h2>
        <CodeBlock label="TYPE">
          {`type OverlayOutcome<Result> =
  | { status: 'resolved'; value: Result }
  | { status: 'closed'; reason: OverlayCloseReason }

type OverlayCloseReason =
  | 'cancel'
  | 'escape'
  | 'outside'
  | 'route-change'
  | 'programmatic'`}
        </CodeBlock>
        <p>
          <code>resolve(value)</code>는 값이 있는 결과를, <code>close(reason)</code>는 이유가 있는
          종료를 만듭니다. Alert와 Confirm은 편의를 위해 각각 <code>void</code>와{' '}
          <code>boolean</code>으로 단순화합니다.
        </p>
      </section>

      <section id="handle">
        <h2>OverlayHandle</h2>
        <CodeBlock label="APPLICATION">
          {`const editor = overlay.open<Result>(
  <ProjectEditor projectId={projectId} />,
)

editor.close('programmatic')
const outcome = await editor`}
        </CodeBlock>
        <ContractList>
          <li>Handle 자체가 Promise이므로 바로 await할 수 있습니다.</li>
          <li>
            <code>handle.close()</code>는 Handle이 가리키는 정확한 세션만 닫습니다.
          </li>
          <li>이미 종료가 결정된 세션에서는 false를 반환합니다.</li>
          <li>Handle은 Promise와 정확한 세션을 닫는 기능만 제공합니다.</li>
        </ContractList>
      </section>

      <section id="close-methods">
        <h2>세 가지 close</h2>
        <div className="decision-guide">
          <article>
            <span>맨 위 하나</span>
            <strong>overlay.close()</strong>
            <p>현재 client의 topmost 세션을 닫습니다.</p>
          </article>
          <article>
            <span>정확한 하나</span>
            <strong>handle.close()</strong>
            <p>중첩 위치와 관계없이 그 세션을 닫습니다.</p>
          </article>
          <article>
            <span>전체 정리</span>
            <strong>overlay.closeAll()</strong>
            <p>route change 같은 경계에서 모든 세션을 닫습니다.</p>
          </article>
        </div>
      </section>

      <section id="snapshot">
        <h2>Props는 호출 시점 snapshot</h2>
        <p>
          <code>open(&lt;Editor status={'{status}'} /&gt;)</code>에 전달한 JSX와 props는 호출 순간의
          값입니다. 부모 state가 바뀌어도 열린 element를 교체하지 않습니다. 입력과 폼 상태는 열린
          컴포넌트 내부에서 관리하고, 외부 최신 데이터가 필요하면 안정적인 ID로 store나 query를
          읽습니다.
        </p>
        <Callout title="업데이트 API를 제공하지 않는 이유">
          modal의 입력을 계속 외부에서 밀어 넣는 구조는 소유권을 흐리게 하고 API를 복잡하게
          만듭니다. 새로운 내용이 별도 상호작용이라면 새 overlay를 여는 편이 명확합니다.
        </Callout>
      </section>
    </DocPage>
  )
}

export function LifecyclePage() {
  return (
    <DocPage
      description="새 modal은 stack의 위에 놓이고, 닫힘을 결정한 뒤 exit가 끝날 때까지 mount를 유지합니다."
      eyebrow="CONCEPTS"
      title="Stack과 overlay lifecycle"
    >
      <section id="states">
        <h2>상태 흐름</h2>
        <ol className="lifecycle-flow">
          <li>
            <span>01</span>
            <strong>opening</strong>
            <small>Renderer가 mount되고 열립니다.</small>
          </li>
          <li>
            <span>02</span>
            <strong>open</strong>
            <small>사용자와 상호작용합니다.</small>
          </li>
          <li>
            <span>03</span>
            <strong>closing</strong>
            <small>결과가 정해지고 exit가 진행됩니다.</small>
          </li>
          <li>
            <span>04</span>
            <strong>removed</strong>
            <small>completeClose 뒤 stack에서 제거됩니다.</small>
          </li>
        </ol>
      </section>

      <section id="lifo">
        <h2>LIFO stack</h2>
        <p>
          마지막에 열린 overlay가 먼저 닫힙니다. 위에 Confirm이 중첩되어도 아래 custom overlay는
          unmount되지 않으므로 폼과 스크롤 state를 유지합니다. topmost가 closing이면 연속 ESC가 아래
          세션으로 통과하지 않습니다.
        </p>
      </section>

      <section id="three-actions">
        <h2>세 가지 종료 동작</h2>
        <dl className="meaning-table">
          <div>
            <dt>close</dt>
            <dd>명시적으로 종료를 결정</dd>
          </div>
          <div>
            <dt>requestClose</dt>
            <dd>ESC·outside 요청을 Core 정책에 전달</dd>
          </div>
          <div>
            <dt>completeClose</dt>
            <dd>exit 완료 후 제거를 알림</dd>
          </div>
        </dl>
        <CodeBlock label="CUSTOM RENDERER">
          {`<Dialog.Root
  open={session.open}
  onOpenChange={(open, details) => {
    if (!open) {
      session.requestClose(
        details.reason === 'escape-key' ? 'escape' : 'outside',
      )
    }
  }}
  onOpenChangeComplete={(open) => {
    if (!open) session.completeClose()
  }}
/>`}
        </CodeBlock>
      </section>

      <section id="close-policy">
        <h2>닫힘 정책</h2>
        <p>
          custom <code>open()</code>은 <code>closeOnEscape</code>와 <code>closeOnOutsidePress</code>
          를 options로 받습니다. Confirm도 같은 예약 필드를 request에 받을 수 있습니다. Alert는 내용
          인지 action으로만 닫히므로 ESC와 outside를 허용하지 않습니다.
        </p>
        <Callout title="completeClose를 빠뜨리지 마세요">
          closing 뒤 이 신호가 없으면 exit가 끝나도 세션을 stack에서 제거할 수 없습니다.
        </Callout>
      </section>
    </DocPage>
  )
}
