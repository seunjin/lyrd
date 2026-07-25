import { Callout } from '../components/callout'
import { CodeBlock } from '../components/code-block'
import { DocPage } from '../components/doc-page'
import { type DocStepItem, DocSteps } from '../components/doc-steps'
import { DocTable, type DocTableRow } from '../components/doc-table'
import { type RelatedDoc, RelatedDocs } from '../components/related-docs'
import { SectionHeading } from '../components/section-heading'

const introductionRelatedDocs = [
  {
    path: '/getting-started',
    title: '설치부터 시작하기',
    description: 'Scope와 Provider를 연결합니다.',
  },
  {
    path: '/concepts/lifecycle',
    title: 'Stack과 Lifecycle 이해하기',
    description: 'LIFO와 닫힘 결정, exit 완료 흐름을 확인합니다.',
  },
  {
    path: '/api/application',
    title: 'Application API 보기',
    description: '다섯 개의 공개 메서드를 확인합니다.',
  },
] satisfies RelatedDoc[]

const requestFlowSteps = [
  {
    id: 'application-call',
    title: '제품 코드가 의도를 호출합니다',
    description: (
      <>
        호출부는 <code>alert()</code>, <code>confirm()</code> 또는 <code>open()</code>으로 필요한
        사용자 상호작용과 기다릴 결과를 표현합니다.
      </>
    ),
  },
  {
    id: 'scope-client',
    title: 'Scope와 client가 요청을 세션으로 만듭니다',
    description:
      '앱에서 정의한 request 타입을 유지하면서 새 세션을 LIFO stack의 가장 위에 추가합니다.',
  },
  {
    id: 'app-renderer',
    title: '앱 Renderer가 제품 UI를 그립니다',
    description:
      '문구, 버튼, 오류 표현과 Dialog·Sheet 형태는 패키지가 아니라 애플리케이션 코드가 소유합니다.',
  },
  {
    id: 'ui-primitive',
    title: 'UI primitive가 접근성 동작을 수행합니다',
    description:
      'Base UI, Radix 또는 자체 UI가 focus, portal, ESC와 outside press 같은 실제 입력을 처리합니다.',
  },
  {
    id: 'promise-result',
    title: 'Core가 결과와 종료 순서를 돌려줍니다',
    description:
      '명시 action과 닫힘 reason을 Promise 결과로 완료하고 exit가 끝난 세션을 stack에서 제거합니다.',
  },
] satisfies DocStepItem[]

const apiDecisionRows = [
  {
    id: 'alert',
    cells: [
      <code key="alert-api">alert()</code>,
      '내용을 알리고 확인 action 하나로 닫기',
      <code key="alert-result">void</code>,
    ],
  },
  {
    id: 'confirm',
    cells: [
      <code key="confirm-api">confirm()</code>,
      '취소와 진행을 선택하고 확인 작업까지 관리하기',
      <code key="confirm-result">boolean</code>,
    ],
  },
  {
    id: 'open',
    cells: [
      <code key="open-api">open()</code>,
      '제품 전용 Dialog, Sheet 또는 복합 화면 열기',
      <code key="open-result">OverlayOutcome&lt;Result&gt;</code>,
    ],
  },
] satisfies DocTableRow[]

export function IntroductionPage() {
  return (
    <DocPage
      description="Lyrd는 UI를 대신 그리지 않습니다. 앱이 소유한 modal UI와 제품 코드 사이에서 요청, 결과와 LIFO stack을 관리합니다."
      eyebrow="INTRODUCTION"
      title="오버레이를 제품의 의도로 다루기"
    >
      <section id="why-lyrd">
        <SectionHeading id="why-lyrd">왜 Lyrd인가</SectionHeading>
        <p>
          Dialog 컴포넌트를 그리는 것만으로는 여러 화면에서 발생하는 중복 호출, 비동기 작업, 중첩
          순서와 결과 반환을 통일하기 어렵습니다. Lyrd는 이 제품 흐름을 관리하면서도 실제 UI는 앱에
          남깁니다. 자주 쓰는 흐름은 <code>alert()</code>와 <code>confirm()</code>으로 통일하고,
          나머지 Dialog, Sheet와 BottomSheet는 <code>open(&lt;Component /&gt;)</code> 하나로 엽니다.
        </p>
        <Callout title="제한된 Core">
          Core는 화면을 가리는 modal interaction만 다룹니다. Toast와 non-modal notification은 각
          앱의 알림 시스템이 소유합니다.
        </Callout>
      </section>

      <section id="when-to-use">
        <SectionHeading id="when-to-use">언제 사용하는가</SectionHeading>
        <p>
          핵심 기준은 “이 UI가 modal인가”뿐 아니라, 호출부가 사용자 선택이나 닫힘 결과를 기다리고
          여러 화면에서 같은 정책을 공유해야 하는가입니다.
        </p>
        <div className="fit-grid">
          <article>
            <span>LYRD가 잘 맞는 경우</span>
            <h3>호출과 결과가 떨어져 있습니다</h3>
            <ul>
              <li>여러 화면에서 동일한 Alert·Confirm UX를 사용합니다.</li>
              <li>사용자 선택이나 custom overlay 결과를 await해야 합니다.</li>
              <li>overlay가 중첩되고 마지막에 열린 화면부터 닫혀야 합니다.</li>
              <li>비동기 확인 작업의 중복 실행과 오류·재시도를 통일합니다.</li>
            </ul>
          </article>
          <article>
            <span>로컬 state가 더 나은 경우</span>
            <h3>한 화면 안에서 상태가 끝납니다</h3>
            <ul>
              <li>버튼과 Dialog가 같은 컴포넌트에서 단순히 열리고 닫힙니다.</li>
              <li>호출부가 별도의 Promise 결과를 기다릴 필요가 없습니다.</li>
              <li>다른 modal과 중첩되거나 공통 정책을 공유하지 않습니다.</li>
              <li>Toast, Tooltip, Popover 또는 Dropdown 같은 non-modal UI입니다.</li>
            </ul>
          </article>
        </div>
      </section>

      <section id="ownership">
        <SectionHeading id="ownership">역할과 소유권</SectionHeading>
        <div className="concept-grid">
          <article>
            <span>LYRD CORE</span>
            <h3>의도와 흐름</h3>
            <p>Promise 결과, LIFO stack, topmost 판정과 닫힘 lifecycle을 관리합니다.</p>
          </article>
          <article>
            <span>YOUR APP</span>
            <h3>표현과 요청 타입</h3>
            <p>JSX, 스타일, 문구, Alert·Confirm 필드와 모달 형태를 직접 정의합니다.</p>
          </article>
          <article>
            <span>UI PRIMITIVE</span>
            <h3>접근성 동작</h3>
            <p>ESC·outside 감지, 포커스, portal과 접근 가능한 Dialog 동작을 담당합니다.</p>
          </article>
        </div>
        <p>
          앱 Renderer는 두 경계 사이의 adapter입니다. UI primitive가 감지한 ESC나 outside press를{' '}
          <code>requestClose()</code>로 전달하고, Lyrd가 허용한 closing을 UI에 반영한 뒤 exit 완료를{' '}
          <code>completeClose()</code>로 돌려줍니다. Lyrd가 키보드나 포인터 이벤트를 직접 감지하지는
          않습니다.
        </p>
      </section>

      <section id="request-flow">
        <SectionHeading id="request-flow">한 번의 요청이 끝나는 과정</SectionHeading>
        <p>
          Lyrd는 UI를 직접 그리는 계층이 아니라 호출부와 앱 Renderer 사이의 세션을 관리하는
          계층입니다. 한 번의 호출은 다음 순서로 결과까지 이어집니다.
        </p>
        <DocSteps items={requestFlowSteps} />
        <CodeBlock label="APPLICATION TO RESULT">
          {`const confirmed = await overlay.confirm({
  title: '프로젝트를 삭제할까요?',
  tone: 'danger',
  onConfirm: () => deleteProject(),
})

if (confirmed) {
  navigate('/projects')
}`}
        </CodeBlock>
        <Callout title="Renderer는 두 경계를 잇는 adapter입니다">
          UI primitive가 감지한 입력을 Core의 <code>requestClose()</code>로 보내고, Core의{' '}
          <code>open</code>과 <code>phase</code>를 primitive에 반영한 뒤 exit 완료를{' '}
          <code>completeClose()</code>로 돌려줍니다.
        </Callout>
      </section>

      <section id="choose-api">
        <SectionHeading id="choose-api">어떤 메서드를 선택하는가</SectionHeading>
        <p>
          UI 모양이 아니라 사용자가 해야 하는 일과 호출부가 기다릴 결과를 기준으로 선택합니다.
          BottomSheet라는 이유로 별도 메서드를 만들지 않고, 제품 전용 JSX라면 <code>open()</code>을
          사용합니다.
        </p>
        <DocTable
          caption="열기 메서드 선택"
          columns={['메서드', '사용할 상황', '기다리는 결과']}
          rows={apiDecisionRows}
        />
        <p>
          이미 열린 세션을 정리할 때는 새로운 열기 메서드가 아니라 <code>close()</code>,{' '}
          <code>handle.close()</code>, <code>closeAll()</code>을 사용합니다. 각 대상의 차이는
          Outcome과 Handle 문서에서 이어서 설명합니다.
        </p>
        <RelatedDocs items={introductionRelatedDocs} title="추천 다음 단계" />
      </section>
    </DocPage>
  )
}
