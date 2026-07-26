import { Callout } from '../components/callout'
import { CodeBlock } from '../components/code-block'
import { ContractList, DocPage } from '../components/doc-page'
import { DocTable, type DocTableRow } from '../components/doc-table'
import { type RelatedDoc, RelatedDocs } from '../components/related-docs'
import { SectionHeading } from '../components/section-heading'

function inlineCode(value: string) {
  return <code>{value}</code>
}

const publicExportRows = [
  {
    id: 'create-overlay-scope',
    cells: [
      inlineCode('createOverlayScope'),
      '함수',
      '앱 request 타입과 scope 생성',
      'Application API',
    ],
  },
  {
    id: 'use-overlay-session',
    cells: [
      inlineCode('useOverlaySession'),
      'Hook',
      'custom JSX에서 현재 session 접근',
      'Renderer API',
    ],
  },
  {
    id: 'overlay-request-map',
    cells: [inlineCode('OverlayRequestMap'), '타입', 'alert·confirm 앱 필드 map', 'Request 타입'],
  },
  {
    id: 'alert-behavior',
    cells: [inlineCode('AlertBehavior'), '타입', 'Core 예약 onAction', 'Request 타입'],
  },
  {
    id: 'alert-request',
    cells: [inlineCode('AlertRequest'), '타입', '앱 alert 필드와 behavior 결합', 'Request 타입'],
  },
  {
    id: 'confirm-behavior',
    cells: [inlineCode('ConfirmBehavior'), '타입', 'onConfirm과 close policy', 'Request 타입'],
  },
  {
    id: 'confirm-request',
    cells: [
      inlineCode('ConfirmRequest'),
      '타입',
      '앱 confirm 필드와 behavior 결합',
      'Request 타입',
    ],
  },
  {
    id: 'open-options',
    cells: [inlineCode('OpenOptions'), '타입', 'custom overlay close policy', 'Request 타입'],
  },
  {
    id: 'overlay-client',
    cells: [inlineCode('OverlayClient'), '타입', '다섯 application 메서드', 'Application API'],
  },
  {
    id: 'overlay-scope',
    cells: [inlineCode('OverlayScope'), '타입', 'Provider·Hook·client factory', 'Application API'],
  },
  {
    id: 'overlay-handle',
    cells: [inlineCode('OverlayHandle'), '타입', 'awaitable 결과와 exact close', '결과 타입'],
  },
  {
    id: 'overlay-outcome',
    cells: [inlineCode('OverlayOutcome'), '타입', 'custom resolved·closed 결과', '결과 타입'],
  },
  {
    id: 'overlay-close-reason',
    cells: [inlineCode('OverlayCloseReason'), '타입', '최종 close 이유 다섯 가지', '결과 타입'],
  },
  {
    id: 'overlay-close-request-reason',
    cells: [
      inlineCode('OverlayCloseRequestReason'),
      '타입',
      'UI가 요청할 ESC·outside 이유',
      'Lifecycle 타입',
    ],
  },
  {
    id: 'overlay-phase',
    cells: [inlineCode('OverlayPhase'), '타입', 'opening·open·closing 상태', 'Lifecycle 타입'],
  },
  {
    id: 'overlay-session',
    cells: [inlineCode('OverlaySession'), '타입', 'custom JSX session command', 'Renderer API'],
  },
  {
    id: 'overlay-renderers',
    cells: [inlineCode('OverlayRenderers'), '타입', 'Alert·Confirm Renderer map', 'Renderer API'],
  },
  {
    id: 'alert-renderer-props',
    cells: [
      inlineCode('AlertRendererProps'),
      '타입',
      'Alert Renderer 입력과 command',
      'Renderer API',
    ],
  },
  {
    id: 'confirm-renderer-props',
    cells: [
      inlineCode('ConfirmRendererProps'),
      '타입',
      'Confirm Renderer 입력과 command',
      'Renderer API',
    ],
  },
  {
    id: 'confirm-action-status',
    cells: [inlineCode('ConfirmActionStatus'), '타입', 'idle·pending·error 상태', 'Renderer API'],
  },
] satisfies DocTableRow[]

const defaultRows = [
  {
    id: 'open-result',
    cells: [inlineCode('open<Result>'), inlineCode('Result = void'), 'generic 생략'],
  },
  {
    id: 'session-result',
    cells: [inlineCode('OverlaySession<Result>'), inlineCode('Result = void'), 'generic 생략'],
  },
  {
    id: 'open-escape',
    cells: [
      inlineCode('open.options.closeOnEscape'),
      inlineCode('true'),
      'undefined 또는 options 생략',
    ],
  },
  {
    id: 'open-outside',
    cells: [
      inlineCode('open.options.closeOnOutsidePress'),
      inlineCode('true'),
      'undefined 또는 options 생략',
    ],
  },
  {
    id: 'confirm-escape',
    cells: [inlineCode('confirm.closeOnEscape'), inlineCode('true'), 'request field 생략'],
  },
  {
    id: 'confirm-outside',
    cells: [inlineCode('confirm.closeOnOutsidePress'), inlineCode('true'), 'request field 생략'],
  },
  {
    id: 'alert-policy',
    cells: [inlineCode('alert ESC · outside'), inlineCode('false'), '고정된 Alert recipe 정책'],
  },
  {
    id: 'close-reason',
    cells: [
      inlineCode('close · handle.close · closeAll reason'),
      inlineCode('programmatic'),
      '인자 생략',
    ],
  },
  {
    id: 'callbacks',
    cells: [inlineCode('onAction · onConfirm'), inlineCode('undefined'), 'behavior field 생략'],
  },
] satisfies DocTableRow[]

const typeRelatedDocs = [
  {
    path: '/api/application',
    title: 'Application API',
    description: '공개 타입이 실제 호출 메서드에 적용되는 위치를 확인합니다.',
  },
  {
    path: '/api/renderer',
    title: 'Renderer API',
    description: 'Renderer props와 OverlaySession command를 확인합니다.',
  },
  {
    path: '/concepts/glossary',
    title: 'Glossary',
    description: '타입 이름에 사용된 Scope, Session, Outcome의 뜻을 확인합니다.',
  },
] satisfies RelatedDoc[]

export function PublicTypesPage() {
  return (
    <DocPage eyebrow="API REFERENCE">
      <section id="export-index">
        <SectionHeading id="export-index">공개 export 목록</SectionHeading>
        <p>
          아래 목록은 <code>packages/core/src/index.ts</code>의 공개 export와 일대일로 대응합니다.
          내부 runtime 타입은 패키지 root에서 export하지 않습니다.
        </p>
        <DocTable
          caption="@lyrd/core 공개 export"
          columns={['Export', '종류', '역할', '상세 문서']}
          rows={publicExportRows}
        />
      </section>

      <section id="request-types">
        <SectionHeading id="request-types">Request와 application 타입</SectionHeading>
        <CodeBlock label="REQUEST TYPES">
          {`type OverlayRequestMap = {
  alert: object
  confirm: object
}

type AlertBehavior = {
  onAction?: () => void
}

type ConfirmBehavior = {
  onConfirm?: () => void | Promise<void>
  closeOnEscape?: boolean
  closeOnOutsidePress?: boolean
}

type AlertRequest<Fields extends object> =
  Omit<Fields, keyof AlertBehavior> & AlertBehavior

type ConfirmRequest<Fields extends object> =
  Omit<Fields, keyof ConfirmBehavior> & ConfirmBehavior

type OpenOptions = {
  closeOnEscape?: boolean
  closeOnOutsidePress?: boolean
}`}
        </CodeBlock>
        <p>
          실제 타입은 union Fields에도 분배되도록 conditional type으로 선언되어 있습니다. 앱은 scope
          generic에 표시 필드만 정의하고, Core behavior는 호출 시 자동으로 결합됩니다.
        </p>
        <Callout title="예약 필드를 앱 표시 필드로 재정의하지 않습니다" tone="warning">
          alert의 <code>onAction</code>, confirm의 <code>onConfirm</code>·<code>closeOnEscape</code>
          ·<code>closeOnOutsidePress</code>는 Core 예약 필드입니다. 이름이나 타입을 바꿔 scope
          generic에 넣으면 <code>createOverlayScope()</code>가 compile-time 오류를 냅니다.
        </Callout>
        <CodeBlock label="CLIENT AND SCOPE">
          {`type OverlayClient<Requests extends OverlayRequestMap> = {
  alert(request: AlertRequest<Requests['alert']>): OverlayHandle<void>
  confirm(request: ConfirmRequest<Requests['confirm']>): OverlayHandle<boolean>
  open<Result = void>(
    element: ReactElement,
    options?: OpenOptions,
  ): OverlayHandle<OverlayOutcome<Result>>
  close(reason?: OverlayCloseReason): boolean
  closeAll(reason?: OverlayCloseReason): void
}

type OverlayScope<Requests extends OverlayRequestMap> = {
  OverlayProvider: ComponentType<{
    children?: ReactNode
    client?: OverlayClient<Requests>
    renderers: OverlayRenderers<Requests>
  }>
  useOverlay(): OverlayClient<Requests>
  createClient(): OverlayClient<Requests>
}`}
        </CodeBlock>
      </section>

      <section id="result-types">
        <SectionHeading id="result-types">Handle과 결과 타입</SectionHeading>
        <CodeBlock label="RESULT TYPES">
          {`type OverlayCloseReason =
  | 'cancel'
  | 'escape'
  | 'outside'
  | 'route-change'
  | 'programmatic'

type OverlayOutcome<Result> =
  | { status: 'resolved'; value: Result }
  | { status: 'closed'; reason: OverlayCloseReason }

type OverlayHandle<Value> = Promise<Value> & {
  close(reason?: OverlayCloseReason): boolean
}`}
        </CodeBlock>
        <ContractList>
          <li>Alert Handle의 Value는 void입니다.</li>
          <li>Confirm Handle의 Value는 boolean입니다.</li>
          <li>Custom Handle의 Value는 OverlayOutcome&lt;Result&gt;입니다.</li>
          <li>Handle의 close는 자신이 가리키는 정확한 session만 닫습니다.</li>
        </ContractList>
      </section>

      <section id="lifecycle-types">
        <SectionHeading id="lifecycle-types">Renderer와 lifecycle 타입</SectionHeading>
        <CodeBlock label="LIFECYCLE TYPES">
          {`type OverlayCloseRequestReason = 'escape' | 'outside'
type OverlayPhase = 'opening' | 'open' | 'closing'
type ConfirmActionStatus = 'idle' | 'pending' | 'error'

type OverlaySession<Result = void> = {
  open: boolean
  phase: OverlayPhase
  resolve(value: Result): boolean
  close(reason?: OverlayCloseReason): boolean
  requestClose(reason: OverlayCloseRequestReason): boolean
  completeClose(): void
}`}
        </CodeBlock>
        <p>
          <code>AlertRendererProps</code>, <code>ConfirmRendererProps</code>와{' '}
          <code>OverlayRenderers</code>는 앱 Renderer가 구현하는 공개 adapter 계약입니다. 각 필드와
          command의 전체 표는 Renderer API에서 다룹니다.
        </p>
      </section>

      <section id="defaults">
        <SectionHeading id="defaults">기본값 모음</SectionHeading>
        <DocTable
          caption="Core 기본값"
          columns={['항목', '기본값', '적용 조건']}
          rows={defaultRows}
        />
        <Callout title="앱 표시 필드에는 Core 기본값이 없습니다">
          title, description, tone과 버튼 label은 앱이 정의한 request 타입과 Renderer의 책임입니다.
          CLI template은 예시 label을 제공하지만 Core 공개 계약의 기본값은 아닙니다.
        </Callout>
        <RelatedDocs items={typeRelatedDocs} />
      </section>
    </DocPage>
  )
}
