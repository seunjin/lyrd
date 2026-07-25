import { Callout } from '../components/callout'
import { ContractList, DocPage } from '../components/doc-page'
import { DocTable, type DocTableRow } from '../components/doc-table'
import { type RelatedDoc, RelatedDocs } from '../components/related-docs'
import { SectionHeading } from '../components/section-heading'

function inlineCode(value: string) {
  return <code>{value}</code>
}

const structureTerms = [
  {
    id: 'scope',
    cells: [
      inlineCode('Scope'),
      'Alert·Confirm request 타입과 Provider, Hook, client를 한 앱 경계로 묶는 단위',
    ],
  },
  {
    id: 'client',
    cells: [
      inlineCode('Client'),
      'alert, confirm, open, close와 closeAll을 제공하며 독립 stack을 소유하는 객체',
    ],
  },
  {
    id: 'provider',
    cells: [
      inlineCode('Provider'),
      'client를 React tree에 제공하고 현재 stack의 Renderer를 mount하는 컴포넌트',
    ],
  },
  {
    id: 'renderer',
    cells: [
      inlineCode('Renderer'),
      'Core session을 앱의 Alert·Confirm UI 또는 custom JSX와 연결하는 adapter',
    ],
  },
  {
    id: 'primitive',
    cells: [
      inlineCode('UI primitive'),
      'Dialog UI, focus, portal, ESC·outside 입력과 접근성 동작을 담당하는 Base UI·Radix·자체 구현',
    ],
  },
] satisfies DocTableRow[]

const lifecycleTerms = [
  {
    id: 'session',
    cells: [
      inlineCode('Session'),
      '한 번의 alert, confirm 또는 open 호출로 생성되어 결과와 phase를 갖는 실행 단위',
    ],
  },
  {
    id: 'stack',
    cells: [inlineCode('Stack'), '같은 client에 열린 session을 생성 순서로 보관하는 LIFO 목록'],
  },
  {
    id: 'topmost',
    cells: [
      inlineCode('topmost'),
      'stack의 마지막 session. closing 중이어도 completeClose 전까지 topmost로 남음',
    ],
  },
  {
    id: 'phase',
    cells: [inlineCode('Phase'), 'session의 opening, open, closing lifecycle 상태'],
  },
  {
    id: 'handle',
    cells: [
      inlineCode('Handle'),
      '결과를 await하는 Promise에 해당 session만 닫는 close()가 결합된 반환값',
    ],
  },
  {
    id: 'outcome',
    cells: [
      inlineCode('Outcome'),
      'custom overlay가 값으로 끝났는지 이유와 함께 닫혔는지를 구분하는 결과',
    ],
  },
  {
    id: 'snapshot',
    cells: [
      inlineCode('Props snapshot'),
      'open() 호출 순간 저장된 React element와 props. Core update API로 교체되지 않음',
    ],
  },
] satisfies DocTableRow[]

const glossaryRelatedDocs = [
  {
    path: '/introduction',
    title: 'Overview',
    description: 'Lyrd, 앱과 UI primitive의 책임을 전체 흐름에서 확인합니다.',
  },
  {
    path: '/concepts/outcome-and-handle',
    title: 'Outcome과 Handle',
    description: '결과 타입과 정확한 session을 닫는 방법을 예제로 봅니다.',
  },
] satisfies RelatedDoc[]

export function GlossaryPage() {
  return (
    <DocPage
      description="Lyrd 문서와 타입에서 반복해서 사용하는 구조와 lifecycle 용어를 짧게 정의합니다."
      eyebrow="CONCEPTS"
      title="용어집"
    >
      <section id="structure">
        <SectionHeading id="structure">구조와 소유권</SectionHeading>
        <DocTable caption="구조 용어" columns={['용어', '뜻']} rows={structureTerms} />
      </section>

      <section id="lifecycle">
        <SectionHeading id="lifecycle">Session lifecycle</SectionHeading>
        <DocTable caption="Lifecycle 용어" columns={['용어', '뜻']} rows={lifecycleTerms} />
      </section>

      <section id="ownership-rule">
        <SectionHeading id="ownership-rule">한 문장으로 구분하기</SectionHeading>
        <ContractList>
          <li>Lyrd는 request, session, stack, close policy와 Promise 결과를 관리합니다.</li>
          <li>앱은 표시 필드, Renderer, 제품 상태와 사용자 작업을 소유합니다.</li>
          <li>UI primitive는 modal 표현, 입력 감지, focus, portal과 접근성을 담당합니다.</li>
        </ContractList>
        <Callout title="UI 비종속성의 뜻">
          UI가 필요 없다는 뜻이 아니라 Core가 특정 primitive를 강제하지 않는다는 뜻입니다. 앱
          Renderer가 선택한 UI의 사건을 Lyrd session command에 연결해야 합니다.
        </Callout>
        <RelatedDocs items={glossaryRelatedDocs} />
      </section>
    </DocPage>
  )
}
