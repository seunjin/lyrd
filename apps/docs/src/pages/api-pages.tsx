import { Callout } from '../components/callout'
import { CodeBlock } from '../components/code-block'
import { ApiEntry, ContractList, DocPage } from '../components/doc-page'
import { DocTable, type DocTableRow } from '../components/doc-table'
import { type RelatedDoc, RelatedDocs } from '../components/related-docs'
import { SectionHeading } from '../components/section-heading'

function inlineCode(value: string) {
  return <code>{value}</code>
}

const parameterColumns = ['이름', '필수', '기본값', '의미']

const scopeParameterRows = [
  {
    id: 'requests',
    cells: [
      inlineCode('Requests'),
      '필수 generic',
      '없음',
      'alert와 confirm의 앱 표시 필드를 정의하는 OverlayRequestMap',
    ],
  },
] satisfies DocTableRow[]

const alertParameterRows = [
  {
    id: 'request',
    cells: [
      inlineCode('request'),
      '필수',
      '없음',
      "앱 alert 필드와 Core의 선택적 onAction을 합친 AlertRequest<Requests['alert']>",
    ],
  },
] satisfies DocTableRow[]

const confirmParameterRows = [
  {
    id: 'request',
    cells: [
      inlineCode('request'),
      '필수',
      '없음',
      "앱 confirm 필드와 onConfirm·close options를 합친 ConfirmRequest<Requests['confirm']>",
    ],
  },
] satisfies DocTableRow[]

const openParameterRows = [
  {
    id: 'result',
    cells: [
      inlineCode('Result'),
      '선택 generic',
      inlineCode('void'),
      'resolve(value)의 value 타입',
    ],
  },
  {
    id: 'element',
    cells: [inlineCode('element'), '필수', '없음', '새 session에 snapshot으로 저장할 ReactElement'],
  },
  {
    id: 'options',
    cells: [
      inlineCode('options'),
      '선택',
      inlineCode('{}'),
      '호출별 ESC·outside close 정책을 담는 OpenOptions',
    ],
  },
] satisfies DocTableRow[]

const closeParameterRows = [
  {
    id: 'reason',
    cells: [
      inlineCode('reason'),
      '선택',
      inlineCode('programmatic'),
      'topmost session이 값 없이 종료된 이유',
    ],
  },
] satisfies DocTableRow[]

const closeAllParameterRows = [
  {
    id: 'reason',
    cells: [
      inlineCode('reason'),
      '선택',
      inlineCode('programmatic'),
      '현재 client의 모든 미완료 session에 적용할 이유',
    ],
  },
] satisfies DocTableRow[]

const requestFieldRows = [
  {
    id: 'display',
    cells: [
      '표시 필드',
      inlineCode('title · description · tone · label…'),
      '앱',
      'Renderer의 request로 전달',
    ],
  },
  {
    id: 'alert-behavior',
    cells: [inlineCode('onAction'), 'Alert behavior', 'Core 예약', 'Renderer request에서 분리'],
  },
  {
    id: 'confirm-behavior',
    cells: [inlineCode('onConfirm'), 'Confirm behavior', 'Core 예약', 'Renderer request에서 분리'],
  },
  {
    id: 'confirm-close',
    cells: [
      inlineCode('closeOnEscape · closeOnOutsidePress'),
      'Confirm close policy',
      'Core 예약',
      '각 기본값 true, Renderer request에서 분리',
    ],
  },
  {
    id: 'cancel-field',
    cells: [
      inlineCode('onCancel'),
      '선택적 취소 side effect',
      '앱 확장',
      'Renderer request에 그대로 전달',
    ],
  },
] satisfies DocTableRow[]

const commandNamingRows = [
  {
    id: 'alert',
    cells: [inlineCode('onAction'), inlineCode('action()'), '동기 callback 실행 후 void 완료'],
  },
  {
    id: 'confirm',
    cells: [
      inlineCode('onConfirm'),
      inlineCode('confirm()'),
      '동기·비동기 작업과 pending·error·retry 관리 후 true 완료',
    ],
  },
  {
    id: 'cancel',
    cells: [
      inlineCode('onCancel'),
      inlineCode('cancel()'),
      '앱 Renderer가 callback을 직접 실행한 뒤 false 완료',
    ],
  },
] satisfies DocTableRow[]

const applicationRelatedDocs = [
  {
    path: '/getting-started',
    title: 'Quickstart',
    description: '생성된 scope와 Provider에서 첫 Alert를 실행합니다.',
  },
  {
    path: '/recipes/custom-overlay',
    title: 'Custom overlay',
    description: 'open<Result>()와 useOverlaySession<Result>()를 완전한 예제로 연결합니다.',
  },
  {
    path: '/concepts/lifecycle',
    title: 'Stack과 Lifecycle',
    description: 'close, closeAll과 completeClose의 실행 시점을 이해합니다.',
  },
  {
    path: '/playground',
    title: 'Playground',
    description: 'Alert, Confirm과 중첩 stack을 브라우저에서 확인합니다.',
  },
] satisfies RelatedDoc[]

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
        <DocTable
          caption="createOverlayScope generic"
          columns={parameterColumns}
          rows={scopeParameterRows}
        />
        <CodeBlock label="scope.ts">
          {`type AppAlertFields = {
  title: ReactNode
  description?: ReactNode
  actionLabel?: ReactNode
}

type AppConfirmFields = {
  title: ReactNode
  description?: ReactNode
  tone?: 'neutral' | 'danger'
  onCancel?: () => void
}

const appOverlay = createOverlayScope<{
  alert: AppAlertFields
  confirm: AppConfirmFields
}>()

export const useOverlay = appOverlay.useOverlay
export const createOverlayClient = appOverlay.createClient`}
        </CodeBlock>
        <p>
          함수에 전달하는 runtime 인자는 없습니다. 반환된 Provider, Hook과 client factory는 같은
          scope token과 request 타입을 공유합니다. 앱 필드에서 Core 예약 behavior를 다시 선언하면
          compile-time 오류가 발생합니다.
        </p>
      </ApiEntry>

      <section className="api-entry" id="request-fields">
        <div className="api-entry-heading">
          <SectionHeading id="request-fields">Request 필드와 command 이름</SectionHeading>
          <span>호출부 callback은 on*, Renderer command는 동사</span>
        </div>
        <DocTable
          caption="Request 필드 소유권"
          columns={['필드', '역할', '소유', 'Renderer 전달']}
          rows={requestFieldRows}
        />
        <DocTable
          caption="Callback과 Renderer command"
          columns={['호출부 callback', 'Renderer command', 'Core 동작']}
          rows={commandNamingRows}
        />
        <Callout title="onCancel은 Core 내장 behavior가 아닙니다">
          앱이 필요할 때 Confirm 표시 필드에 추가합니다. Renderer는{' '}
          <code>request.onCancel?.()</code>을 직접 실행한 뒤 <code>cancel()</code>을 호출합니다.
          Core는 callback 실행 순서를 대신 정하지 않습니다.
        </Callout>
      </section>

      <ApiEntry
        id="alert"
        name="alert"
        returns={<code>OverlayHandle&lt;void&gt;</code>}
        purpose="내용을 인지하고 닫는 단일 action"
        signature="overlay.alert(request: AlertRequest): OverlayHandle<void>"
      >
        <DocTable caption="alert 파라미터" columns={parameterColumns} rows={alertParameterRows} />
        <CodeBlock>{`await overlay.alert({
  title: '저장했습니다.',
  actionLabel: '확인',
  onAction: () => trackNotice(),
})`}</CodeBlock>
        <p>
          Renderer는 <code>action()</code>을 호출합니다. Core는 호출부의 <code>onAction</code>을
          실행하고 즉시 닫습니다. Alert action은 비동기 pending UX를 제공하지 않습니다.
        </p>
        <ContractList>
          <li>action으로 완료하거나 명시적으로 닫혀도 Handle 값은 void입니다.</li>
          <li>handle.close·overlay.close·closeAll은 onAction을 실행하지 않습니다.</li>
          <li>onAction이 Promise를 반환해도 기다리지 않으며 development에서 경고합니다.</li>
          <li>onAction이 예외를 던지면 Alert를 닫은 뒤 같은 예외를 다시 던집니다.</li>
        </ContractList>
      </ApiEntry>

      <ApiEntry
        id="confirm"
        name="confirm"
        returns={<code>OverlayHandle&lt;boolean&gt;</code>}
        purpose="취소와 진행을 선택하고 확인 작업을 관리"
        signature="overlay.confirm(request: ConfirmRequest): OverlayHandle<boolean>"
      >
        <DocTable
          caption="confirm 파라미터"
          columns={parameterColumns}
          rows={confirmParameterRows}
        />
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
        <ContractList>
          <li>onConfirm이 없거나 동기·비동기로 성공하면 true로 완료합니다.</li>
          <li>cancel·ESC·outside·명시적 close는 false로 완료합니다.</li>
          <li>onConfirm 실패는 error 상태를 제공하고 열린 상태에서 재시도할 수 있습니다.</li>
          <li>pending 중 Renderer의 confirm·cancel·ESC·outside command는 무시됩니다.</li>
          <li>pending 중에도 handle.close나 closeAll 같은 명시적 앱 명령은 false로 종료합니다.</li>
        </ContractList>
      </ApiEntry>

      <ApiEntry
        id="open"
        name="open"
        returns={<code>OverlayHandle&lt;OverlayOutcome&lt;Result&gt;&gt;</code>}
        purpose="임의 JSX로 항상 새 custom overlay를 생성"
        signature="overlay.open<Result = void>(element: ReactElement, options?): OverlayHandle<OverlayOutcome<Result>>"
      >
        <DocTable caption="open 파라미터" columns={parameterColumns} rows={openParameterRows} />
        <CodeBlock>{`const outcome = await overlay.open<ProjectResult>(
  <ProjectEditor projectId={projectId} />,
  { closeOnEscape: true, closeOnOutsidePress: false },
)`}</CodeBlock>
        <p>
          Dialog, Sheet, BottomSheet, Drawer와 fullscreen modal을 모두 이 메서드로 엽니다. 전달한
          JSX와 props는 호출 시점 snapshot입니다. 결과 타입은 컴포넌트 안의{' '}
          <code>useOverlaySession&lt;Result&gt;()</code>과 맞춥니다.
        </p>
        <Callout title="Result는 JSX에서 추론되지 않습니다" tone="warning">
          <code>Result</code>는 입력 파라미터 타입에 등장하지 않으므로 값이 필요하면{' '}
          <code>open&lt;ProjectResult&gt;()</code>에 명시합니다. custom 컴포넌트의{' '}
          <code>useOverlaySession&lt;ProjectResult&gt;()</code>과 같은 타입을 사용해야 하지만 두
          위치를 Core가 자동으로 연결하지는 않습니다.
        </Callout>
        <ContractList>
          <li>Result를 생략하면 void입니다.</li>
          <li>closeOnEscape와 closeOnOutsidePress의 기본값은 각각 true입니다.</li>
          <li>
            resolve(value)는 resolved outcome, close는 reason이 있는 closed outcome을 반환합니다.
          </li>
          <li>전달한 ReactElement와 props는 호출 시점 snapshot이며 update 메서드는 없습니다.</li>
        </ContractList>
      </ApiEntry>

      <ApiEntry
        id="close"
        name="close"
        returns={<code>boolean</code>}
        purpose="현재 client에서 가장 나중에 열린 세션 종료"
        signature="overlay.close(reason?: OverlayCloseReason): boolean"
      >
        <DocTable caption="close 파라미터" columns={parameterColumns} rows={closeParameterRows} />
        <p>
          LIFO stack의 topmost 세션을 닫습니다. reason 기본값은 <code>programmatic</code>입니다.
          특정 호출이 연 세션을 닫으려면 <code>handle.close()</code>를 사용합니다.
        </p>
        <ContractList>
          <li>
            닫힘을 처음 결정하면 true, stack이 비었거나 topmost가 이미 closing이면 false입니다.
          </li>
          <li>ESC·outside 옵션은 확인하지 않는 명시적 앱 명령입니다.</li>
          <li>closing topmost를 건너뛰어 아래 세션을 닫지 않습니다.</li>
        </ContractList>
      </ApiEntry>

      <ApiEntry
        id="close-all"
        name="closeAll"
        returns={<code>void</code>}
        purpose="현재 client의 모든 세션 종료"
        signature="overlay.closeAll(reason?: OverlayCloseReason): void"
      >
        <DocTable
          caption="closeAll 파라미터"
          columns={parameterColumns}
          rows={closeAllParameterRows}
        />
        <CodeBlock>{`overlay.closeAll('route-change')`}</CodeBlock>
        <p>
          로그아웃이나 route 전환처럼 열린 modal interaction을 한꺼번에 정리할 때 사용합니다.
          반환값은 없지만 모든 미완료 Handle은 alert·confirm·custom 각각의 결과 계약으로 완료됩니다.
        </p>
      </ApiEntry>

      <section id="related">
        <SectionHeading id="related">예제와 동작 확인</SectionHeading>
        <RelatedDocs items={applicationRelatedDocs} />
      </section>
    </DocPage>
  )
}
