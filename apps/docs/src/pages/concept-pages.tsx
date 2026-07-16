import { Link } from 'react-router-dom'

import { Callout, CodeBlock, ContractList, DocPage } from '../components/doc-page'

export function OutcomeAndHandlePage() {
  return (
    <DocPage
      description="open()의 반환값은 결과를 기다릴 수 있는 Promise이면서, 활성 세션을 직접 제어하는 Handle입니다."
      eyebrow="CONCEPTS"
      title="Outcome과 awaitable Handle"
    >
      <section id="outcome">
        <h2>OverlayOutcome</h2>
        <CodeBlock label="TYPE">
          {`type OverlayOutcome<Result> =
  | { status: 'resolved'; value: Result }
  | { status: 'dismissed'; reason: OverlayDismissReason }`}
        </CodeBlock>
        <p>
          Renderer가 <code>resolve(value)</code>를 호출하면 값이 있는 결과가 되고, dismiss되면
          이유가 보존됩니다. 일반 호출부는 기존 Promise처럼 바로 기다리면 됩니다.
        </p>
        <CodeBlock>{`const outcome = await overlay.open(projectSettings, input)`}</CodeBlock>
      </section>

      <section id="handle">
        <h2>OverlayHandle</h2>
        <CodeBlock label="APPLICATION">
          {`const handle = overlay.open(projectSettings, input)

handle.update(nextInput)
handle.dismiss('programmatic')

const outcome = await handle`}
        </CodeBlock>
        <ContractList>
          <li>
            <code>update(input)</code>은 Handle이 가리키는 활성 세션만 갱신합니다.
          </li>
          <li>
            <code>dismiss(reason?)</code>은 해당 세션을 명시적으로 종료합니다.
          </li>
          <li>두 메서드는 성공 여부를 boolean으로 반환합니다.</li>
          <li>종료된 Handle에서는 false를 반환하며 새 세션을 만들지 않습니다.</li>
          <li>
            <code>handle.dismiss()</code>는 명시적 Application action이라 dismiss policy를
            우회합니다.
          </li>
        </ContractList>
      </section>

      <section id="choose">
        <h2>어떤 호출 방식을 선택할까</h2>
        <div className="decision-guide">
          <article>
            <span>결과만 필요함</span>
            <strong>await overlay.open(...)</strong>
            <p>한 번 열고 최종 outcome만 처리합니다.</p>
          </article>
          <article>
            <span>한 로컬 흐름에서 갱신</span>
            <strong>handle.update(...)</strong>
            <p>open()의 직접 반환값을 보관해 같은 세션을 갱신합니다.</p>
          </article>
          <article>
            <span>여러 호출부에서 탐색</span>
            <strong>openOrUpdate(...)</strong>
            <p>안정적인 업무 identity로 같은 활성 세션을 찾습니다.</p>
          </article>
        </div>
      </section>

      <section id="promise-detail">
        <h2>Promise 세부사항</h2>
        <Callout title="직접 반환값을 보관하세요">
          <code>open()</code>과 <code>openOrUpdate()</code>는 실제 Promise를 확장한 Handle을
          반환합니다. Promise의 <code>.then()</code>이 반환하는 값은 일반 Promise이므로 제어가
          필요하면 원래 Handle을 보관해야 합니다.
        </Callout>
        <Link className="text-link" to="/recipes/progress">
          Progress recipe에서 Handle 사용 보기 →
        </Link>
      </section>
    </DocPage>
  )
}

export function LifecyclePage() {
  return (
    <DocPage
      description="Renderer가 닫기로 결정하는 순간과 UI primitive가 닫기를 시도하는 순간, exit animation이 끝나는 순간은 서로 다릅니다."
      eyebrow="CONCEPTS"
      title="Overlay lifecycle"
    >
      <section id="states">
        <h2>상태 흐름</h2>
        <ol className="lifecycle-flow">
          <li>
            <span>01</span>
            <strong>mounting</strong>
            <small>Renderer가 트리에 들어옵니다.</small>
          </li>
          <li>
            <span>02</span>
            <strong>open</strong>
            <small>Primitive가 상호작용 가능한 상태입니다.</small>
          </li>
          <li>
            <span>03</span>
            <strong>closing</strong>
            <small>결과가 확정되고 exit이 진행됩니다.</small>
          </li>
          <li>
            <span>04</span>
            <strong>removed</strong>
            <small>completeExit 이후 최종 제거됩니다.</small>
          </li>
        </ol>
        <p>
          Confirm은 작업을 실행하는 동안 <code>pending</code>, 실패 후 재시도할 때{' '}
          <code>error</code> 상태도 사용합니다. Renderer는 <code>session.open</code>과{' '}
          <code>session.status</code>로 현재 상태를 UI에 반영합니다.
        </p>
      </section>

      <section id="three-actions">
        <h2>세 가지 종료 동작</h2>
        <dl className="meaning-table">
          <div>
            <dt>dismiss</dt>
            <dd>종료하기로 확정</dd>
          </div>
          <div>
            <dt>requestDismiss</dt>
            <dd>외부 dismiss 시도를 정책에 전달</dd>
          </div>
          <div>
            <dt>completeExit</dt>
            <dd>exit lifecycle 완료를 알림</dd>
          </div>
        </dl>
        <CodeBlock label="RENDERER">
          {`<Dialog.Root
  open={session.open}
  onOpenChange={(open, details) => {
    if (!open) {
      session.requestDismiss(
        details.reason === 'escape-key' ? 'escape' : 'outside',
      )
    }
  }}
  onOpenChangeComplete={(open) => {
    if (!open) session.completeExit()
  }}
/>`}
        </CodeBlock>
      </section>

      <section id="dismiss-policy">
        <h2>Dismiss policy</h2>
        <p>
          <code>dismissPolicy: 'block'</code>은 ESC나 outside click처럼 Renderer가 전달한 외부
          요청을 차단합니다. 취소 버튼의 <code>session.dismiss()</code>나 Application의{' '}
          <code>handle.dismiss()</code>처럼 이미 결정된 명시적 action은 차단하지 않습니다.
        </p>
        <Callout title="completeExit을 빠뜨리지 마세요">
          closing 이후 transition이 끝났음을 알리지 않으면 세션이 렌더 트리에서 제거되지 않고 다음
          queue 항목도 열리지 않을 수 있습니다.
        </Callout>
      </section>
    </DocPage>
  )
}

export function GroupsAndSchedulingPage() {
  return (
    <DocPage
      description="Group은 strategy 옵션을 감싼 표식이 아니라, 동일한 실행 전략과 상태 공간을 공유하는 독립적인 coordination boundary입니다."
      eyebrow="CONCEPTS"
      title="Groups와 scheduling"
    >
      <section id="default-queue">
        <h2>기본 modal queue</h2>
        <p>
          group을 생략한 <code>alert</code>, <code>confirm</code>, <code>open</code>은 안전한 기본
          queue를 사용합니다. 한 세션의 exit이 완료되면 다음 항목이 열립니다.
        </p>
      </section>

      <section id="group-boundary">
        <h2>독립 coordination boundary</h2>
        <CodeBlock label="GROUP DEFINITION">
          {`const toastGroup = defineOverlayGroup({
  strategy: 'parallel',
})`}
        </CodeBlock>
        <p>
          같은 group identity를 사용하는 세션은 동일한 scheduling 공간에 속합니다. 활성 세션을
          <code>openOrUpdate()</code>할 때 그 세션의 group은 변경할 수 없습니다.
        </p>
      </section>

      <section id="parallel">
        <h2>Parallel strategy</h2>
        <CodeBlock label="APPLICATION">
          {`const outcome = await overlay.open(
  appToast,
  { toastId, title: '저장했습니다.' },
  { group: toastGroup },
)`}
        </CodeBlock>
        <p>
          parallel group의 세션은 서로 기다리지 않고 기본 modal queue도 막지 않습니다. 현재 첫 group
          API는 실제 Toast 사용 사례에 필요한 <code>parallel</code>만 제공합니다.
          <code>dismissAll()</code>은 기본 queue와 모든 parallel group을 함께 정리합니다.
        </p>
      </section>
    </DocPage>
  )
}
