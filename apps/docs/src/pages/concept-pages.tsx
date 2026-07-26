import { Callout } from '../components/callout'
import { CodeBlock } from '../components/code-block'
import { ContractList, DocPage } from '../components/doc-page'
import { type DocStepItem, DocSteps } from '../components/doc-steps'
import { type RelatedDoc, RelatedDocs } from '../components/related-docs'
import { SectionHeading } from '../components/section-heading'

function inlineCode(value: string) {
  return <code>{value}</code>
}

const nestedCloseSteps = [
  {
    id: 'open-editor',
    title: 'Editor를 엽니다',
    description: inlineCode('[Editor(topmost)]'),
  },
  {
    id: 'open-confirm',
    title: 'Editor 위에 Confirm을 엽니다',
    description: inlineCode('[Editor, Confirm(topmost)]'),
  },
  {
    id: 'close-confirm',
    title: 'overlay.close()가 Confirm만 closing으로 전환합니다',
    description: 'Confirm은 false로 완료되고 Editor의 폼과 스크롤 상태는 유지됩니다.',
  },
  {
    id: 'remove-confirm',
    title: 'Confirm의 exit 뒤 completeClose()를 호출합니다',
    description: inlineCode('[Editor(topmost)]'),
  },
  {
    id: 'finish-editor',
    title: 'Editor가 값을 resolve하고 exit 뒤 제거됩니다',
    description: '호출부는 resolved outcome을 받고 stack은 비게 됩니다.',
  },
] satisfies DocStepItem[]

const lifecycleSteps = [
  {
    id: 'opening',
    title: 'opening',
    description: '세션과 Renderer가 생성되고 Provider가 open 전환을 준비합니다.',
  },
  {
    id: 'open',
    title: 'open',
    description: 'open=true이며 사용자가 UI와 상호작용합니다.',
  },
  {
    id: 'closing',
    title: 'closing',
    description: '결과는 정해졌지만 exit를 위해 Renderer는 아직 mount되어 있습니다.',
  },
  {
    id: 'removed',
    title: 'removed',
    description: 'completeClose 뒤 stack에서 제거되고 unmount됩니다.',
  },
] satisfies DocStepItem[]

const outcomeRelatedDocs = [
  {
    path: '/api/public-types',
    title: 'Public Types & Defaults',
    description: 'Outcome, close reason과 Handle의 전체 타입을 확인합니다.',
  },
  {
    path: '/api/application',
    title: 'Application API',
    description: '각 close 메서드의 정확한 시그니처를 확인합니다.',
  },
  {
    path: '/concepts/lifecycle',
    title: 'Stack & Lifecycle',
    description: '결과 결정과 실제 제거가 분리되는 과정을 이어서 봅니다.',
  },
] satisfies RelatedDoc[]

const lifecycleRelatedDocs = [
  {
    path: '/api/public-types',
    title: 'Public Types & Defaults',
    description: 'ESC·outside 정책의 정확한 기본값을 확인합니다.',
  },
  {
    path: '/api/renderer',
    title: 'Renderer API',
    description: 'UI primitive가 requestClose와 completeClose를 호출하는 방법입니다.',
  },
  {
    path: '/concepts/glossary',
    title: 'Glossary',
    description: 'Scope, Session, topmost와 snapshot의 뜻을 빠르게 찾습니다.',
  },
] satisfies RelatedDoc[]

export function OutcomeAndHandlePage() {
  return (
    <DocPage eyebrow="CONCEPTS">
      <section id="outcome">
        <SectionHeading id="outcome">OverlayOutcome</SectionHeading>
        <CodeBlock label="TYPE">
          {`type OverlayOutcome<Result> =
  | { status: 'resolved'; value: Result }
  | { status: 'closed'; reason: OverlayCloseReason }`}
        </CodeBlock>
        <p>
          custom overlay가 값을 확정하면 <code>resolved</code>, 값 없이 닫히면 <code>closed</code>가
          됩니다. 이 구분 덕분에 유효한 값과 ESC·취소·route 전환을 하나의 결과 타입에서 안전하게
          나눌 수 있습니다.
        </p>
        <CodeBlock label="RESULT HANDLING">
          {`const outcome = await overlay.open<ProjectResult>(
  <ProjectEditor projectId={projectId} />,
)

if (outcome.status === 'resolved') {
  saveToList(outcome.value)
} else if (outcome.reason === 'route-change') {
  releaseDraftLock()
}`}
        </CodeBlock>
        <Callout title="Alert와 Confirm은 더 단순한 값을 반환합니다">
          <code>alert()</code>은 <code>void</code>, <code>confirm()</code>은 확인하면{' '}
          <code>true</code>, 취소·ESC·outside·명시적 close이면 <code>false</code>입니다. 닫힌
          이유까지 분기해야 하는 상호작용은 custom <code>open()</code>이 맞습니다.
        </Callout>
      </section>

      <section id="handle">
        <SectionHeading id="handle">OverlayHandle</SectionHeading>
        <CodeBlock label="APPLICATION">
          {`const editor = overlay.open<ProjectResult>(
  <ProjectEditor projectId={projectId} />,
)

const timeoutId = window.setTimeout(
  () => editor.close('programmatic'),
  30_000,
)
const outcome = await editor
window.clearTimeout(timeoutId)`}
        </CodeBlock>
        <ContractList>
          <li>Handle 자체가 Promise이므로 바로 await하거나 Promise API와 조합할 수 있습니다.</li>
          <li>
            <code>handle.close()</code>는 stack 위치와 관계없이 Handle이 가리키는 세션만 닫습니다.
          </li>
          <li>
            reason을 생략하면 <code>programmatic</code>을 사용합니다.
          </li>
          <li>처음 종료를 결정한 호출만 true이며, 이미 결정된 세션에서는 false를 반환합니다.</li>
          <li>Handle은 Promise와 정확한 세션을 닫는 기능만 제공하며 update API는 없습니다.</li>
        </ContractList>
      </section>

      <section id="close-methods">
        <SectionHeading id="close-methods">세 가지 close의 대상</SectionHeading>
        <ul>
          <li>
            <code>overlay.close()</code>는 현재 client의 topmost 세션을 닫습니다.
          </li>
          <li>
            <code>handle.close()</code>는 Handle이 가리키는 정확한 세션을 닫습니다.
          </li>
          <li>
            <code>overlay.closeAll()</code>은 route 전환처럼 현재 경계를 정리할 때 사용합니다.
          </li>
        </ul>
        <CodeBlock label="ROUTE CLEANUP">
          {`useEffect(() => {
  return () => overlay.closeAll('route-change')
}, [overlay])`}
        </CodeBlock>
        <p>
          세 메서드는 모두 결과를 결정하고 세션을 <code>closing</code>으로 전환합니다.{' '}
          <code>closeAll()</code>의 반환값은 없지만, 각 Handle은 자신의 계약에 맞는 값으로
          완료됩니다.
        </p>
      </section>

      <section id="result-timing">
        <SectionHeading id="result-timing">Promise 완료와 DOM 제거는 다른 시점</SectionHeading>
        <CodeBlock label="TIMELINE">
          {`resolve(value) · close(reason) · requestClose(reason)
→ Promise 완료 + phase: 'closing' + open: false
→ UI exit transition 실행
→ completeClose()
→ stack 제거 + unmount`}
        </CodeBlock>
        <p>
          호출부의 <code>await</code>는 닫힘이 결정되는 첫 단계에서 이어집니다. Renderer는 그 뒤에도
          exit를 끝낼 때까지 mount되어 있습니다. 따라서 Promise 완료를 DOM 제거 완료 신호로 해석하지
          않습니다.
        </p>
        <Callout title="closing 중인 topmost도 stack의 맨 위입니다" tone="warning">
          exit가 끝나기 전에 <code>overlay.close()</code>를 다시 호출하면 false를 반환하며 아래
          세션을 닫지 않습니다. <code>completeClose()</code>로 맨 위 세션이 제거된 뒤에야 아래
          세션이 topmost가 됩니다.
        </Callout>
      </section>

      <section id="snapshot">
        <SectionHeading id="snapshot">Props는 호출 시점 snapshot</SectionHeading>
        <p>
          <code>open(&lt;Editor status={'{status}'} /&gt;)</code>에 전달한 React element와 props는
          호출 순간의 값입니다. 부모 state가 바뀌어도 Core가 열린 element를 새 element로 교체하지
          않습니다.
        </p>
        <ContractList>
          <li>입력값과 임시 폼 상태는 열린 컴포넌트 내부에서 관리합니다.</li>
          <li>서버 데이터가 계속 바뀐다면 안정적인 ID를 전달하고 query나 store에서 읽습니다.</li>
          <li>
            외부 context나 store를 직접 구독하는 컴포넌트의 일반적인 React 갱신은 그대로 동작합니다.
          </li>
        </ContractList>
        <Callout title="업데이트 API를 제공하지 않는 이유">
          modal의 표시 props를 부모가 계속 밀어 넣는 구조는 상태 소유권을 흐리게 하고 API를 복잡하게
          만듭니다. 내용 교체가 별도 사용자 상호작용이라면 새 overlay를 여는 편이 명확합니다.
        </Callout>
        <RelatedDocs items={outcomeRelatedDocs} />
      </section>
    </DocPage>
  )
}

export function LifecyclePage() {
  return (
    <DocPage eyebrow="CONCEPTS">
      <section id="states">
        <SectionHeading id="states">상태 흐름</SectionHeading>
        <DocSteps items={lifecycleSteps} />
        <p>
          공개 <code>OverlayPhase</code>는 opening·open·closing 세 값입니다. removed는 세션이 더
          이상 snapshot에 존재하지 않는 상태를 설명하기 위한 문서 용어입니다.
        </p>
      </section>

      <section id="lifo">
        <SectionHeading id="lifo">LIFO 중첩 시나리오</SectionHeading>
        <p>
          Lyrd의 stack은 마지막에 연 modal을 먼저 다루는 LIFO입니다. 위에 Confirm이 열려도 아래
          custom overlay를 다시 만들지 않으므로 입력, 폼과 스크롤 상태를 유지합니다.
        </p>
        <DocSteps items={nestedCloseSteps} />
        <Callout title="closing top을 건너뛰지 않습니다">
          Confirm이 closing인 동안 반복 ESC·outside 요청이나 <code>overlay.close()</code>는 아래
          Editor로 통과하지 않습니다. exit 중 사용자의 연속 입력이 다른 modal까지 닫는 것을
          막습니다.
        </Callout>
      </section>

      <section id="three-actions">
        <SectionHeading id="three-actions">닫기, 요청, 제거</SectionHeading>
        <dl className="meaning-table">
          <div>
            <dt>close</dt>
            <dd>버튼·route cleanup처럼 앱이 이미 닫기로 결정한 명시적 명령</dd>
          </div>
          <div>
            <dt>requestClose</dt>
            <dd>ESC·outside 입력을 topmost와 호출별 정책에 문의하는 요청</dd>
          </div>
          <div>
            <dt>completeClose</dt>
            <dd>exit가 끝났으므로 stack에서 제거해도 된다는 Renderer 신호</dd>
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
        <p>
          UI primitive가 ESC와 outside press를 감지하고 Renderer가 이유를 변환합니다. Lyrd는 전역
          keyboard·pointer listener를 설치하지 않으며 전달받은 요청의 허용 여부만 판단합니다.
        </p>
      </section>

      <section id="close-policy">
        <SectionHeading id="close-policy">닫힘 정책과 기본값</SectionHeading>
        <p>
          Alert는 명시적인 action으로만 닫습니다. Confirm과 custom overlay는 ESC와 outside press를
          기본 허용하며, 각 호출에서 정책을 바꿀 수 있습니다. 정확한 기본값과 타입은 Public Types &
          Defaults에서 관리합니다.
        </p>
        <CodeBlock label="PER-CALL OVERRIDE">
          {`const confirmed = await overlay.confirm({
  title: '작성 중인 내용을 버릴까요?',
  closeOnEscape: false,
  closeOnOutsidePress: false,
})

const editor = overlay.open(<ProjectEditor />, {
  closeOnEscape: true,
  closeOnOutsidePress: false,
})`}
        </CodeBlock>
        <ContractList>
          <li>옵션은 Provider 전역 설정이 아니라 각 호출에서 생성된 세션에 저장됩니다.</li>
          <li>
            <code>requestClose()</code>는 요청한 세션이 topmost인지 먼저 확인한 뒤 정책을
            적용합니다.
          </li>
          <li>
            취소 버튼의 <code>close('cancel')</code>, <code>handle.close()</code>와{' '}
            <code>closeAll()</code> 같은 명시적 명령에는 ESC·outside 정책을 적용하지 않습니다.
          </li>
          <li>Confirm이 pending이면 Renderer command가 confirm·cancel·ESC·outside를 막습니다.</li>
        </ContractList>
      </section>

      <section id="complete-close">
        <SectionHeading id="complete-close">completeClose 호출 시점</SectionHeading>
        <ContractList>
          <li>
            exit animation이 있으면 primitive의 close transition 완료 callback에서 호출합니다.
          </li>
          <li>animation이 없으면 open=false가 UI에 반영된 직후 제거를 완료합니다.</li>
          <li>opening·open 단계에서 미리 호출해도 세션은 제거되지 않습니다.</li>
          <li>development에서 closing이 10초 이상 남으면 누락을 알리는 경고가 출력됩니다.</li>
        </ContractList>
        <Callout title="completeClose를 빠뜨리지 마세요" tone="warning">
          Promise는 이미 완료되더라도 세션은 stack에 남아 다음 입력을 막습니다. Renderer가 exit
          완료를 알 수 없는 UI라면 closing phase를 관찰해 직접 호출하는 adapter를 구현해야 합니다.
        </Callout>
        <RelatedDocs items={lifecycleRelatedDocs} />
      </section>
    </DocPage>
  )
}
