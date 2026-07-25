import { Callout } from '../components/callout'
import { CodeBlock } from '../components/code-block'
import { ContractList, DocPage } from '../components/doc-page'
import { type DocStepItem, DocSteps } from '../components/doc-steps'
import { DocTable, type DocTableRow } from '../components/doc-table'
import { type RelatedDoc, RelatedDocs } from '../components/related-docs'
import { SectionHeading } from '../components/section-heading'

function inlineCode(value: string) {
  return <code>{value}</code>
}

const alertRendererRows = [
  {
    id: 'open',
    cells: [
      inlineCode('open'),
      inlineCode('boolean'),
      'controlled primitive에 전달할 현재 open 값',
    ],
  },
  {
    id: 'phase',
    cells: [inlineCode('phase'), inlineCode('OverlayPhase'), 'opening·open·closing lifecycle'],
  },
  {
    id: 'request',
    cells: [inlineCode('request'), inlineCode('Request'), '앱이 정의한 Alert 표시 필드'],
  },
  {
    id: 'action',
    cells: [inlineCode('action()'), inlineCode('void'), 'onAction을 동기로 실행하고 void 완료'],
  },
  {
    id: 'complete-close',
    cells: [inlineCode('completeClose()'), inlineCode('void'), 'exit 완료 뒤 session 제거'],
  },
] satisfies DocTableRow[]

const confirmRendererRows = [
  {
    id: 'open',
    cells: [
      inlineCode('open'),
      inlineCode('boolean'),
      'controlled primitive에 전달할 현재 open 값',
    ],
  },
  {
    id: 'phase',
    cells: [inlineCode('phase'), inlineCode('OverlayPhase'), 'opening·open·closing lifecycle'],
  },
  {
    id: 'request',
    cells: [inlineCode('request'), inlineCode('Request'), 'Core behavior가 제거된 앱 표시 필드'],
  },
  {
    id: 'action-status',
    cells: [
      inlineCode('actionStatus'),
      inlineCode("'idle' | 'pending' | 'error'"),
      '확인 작업 상태',
    ],
  },
  {
    id: 'error',
    cells: [inlineCode('error'), inlineCode('unknown | null'), '실패 원본, error가 아니면 null'],
  },
  {
    id: 'confirm',
    cells: [inlineCode('confirm()'), inlineCode('void'), 'onConfirm과 pending·error·retry 실행'],
  },
  {
    id: 'cancel',
    cells: [
      inlineCode('cancel()'),
      inlineCode('void'),
      'false로 완료, onCancel은 자동 실행하지 않음',
    ],
  },
  {
    id: 'request-close',
    cells: [
      inlineCode('requestClose(reason)'),
      inlineCode('void'),
      'ESC·outside 요청을 topmost와 policy에 전달',
    ],
  },
  {
    id: 'complete-close',
    cells: [inlineCode('completeClose()'), inlineCode('void'), 'exit 완료 뒤 session 제거'],
  },
] satisfies DocTableRow[]

const responsibilityRows = [
  {
    id: 'application',
    cells: ['애플리케이션', '표시 필드, 문구, 제품 상태, onAction·onConfirm·onCancel 작업'],
  },
  {
    id: 'primitive',
    cells: [
      'UI primitive',
      'ESC·outside 감지, focus trap과 복원, portal, inert·scroll lock, ARIA, exit event',
    ],
  },
  {
    id: 'renderer',
    cells: [
      'Renderer adapter',
      'request 표시, UI event를 command로 변환, pending·error 표현, completeClose 호출',
    ],
  },
  {
    id: 'core',
    cells: ['Lyrd Core', 'session, topmost, 호출별 close policy, LIFO stack과 Promise 결과'],
  },
] satisfies DocTableRow[]

const confirmActionSteps = [
  {
    id: 'idle',
    title: 'idle에서 confirm()을 호출합니다',
    description: 'onConfirm이 없거나 동기 성공이면 바로 true로 완료합니다.',
  },
  {
    id: 'pending',
    title: 'Promise가 반환되면 pending이 됩니다',
    description: 'Renderer는 확인·취소 버튼을 비활성화하고 aria-busy를 표시합니다.',
  },
  {
    id: 'error',
    title: '실패하면 error로 열린 상태를 유지합니다',
    description: 'error를 role=alert 영역에 표시하고 같은 confirm()을 다시 호출할 수 있습니다.',
  },
  {
    id: 'retry',
    title: '재시도가 성공하면 true로 완료합니다',
    description: 'Core가 error를 지우고 다시 pending을 거쳐 closing으로 전환합니다.',
  },
  {
    id: 'explicit-close',
    title: '앱의 명시적 close는 pending 중에도 종료할 수 있습니다',
    description: 'handle.close()나 closeAll()은 늦게 도착한 onConfirm 결과를 무시합니다.',
  },
] satisfies DocStepItem[]

const rendererRelatedDocs = [
  {
    path: '/api/application',
    title: 'Application API',
    description: '호출부 callback과 request 필드의 계약을 확인합니다.',
  },
  {
    path: '/api/public-types',
    title: 'Public types·defaults',
    description: 'Renderer props와 lifecycle 타입의 원형을 확인합니다.',
  },
  {
    path: '/recipes/nested-confirm',
    title: 'Nested Confirm',
    description: '중첩된 UI primitive의 LIFO와 focus 동작을 확인합니다.',
  },
] satisfies RelatedDoc[]

export function RendererGuidePage() {
  return (
    <DocPage
      boundary="renderer"
      description="앱 Renderer가 Core session을 Base UI, Radix 또는 자체 modal의 controlled lifecycle에 연결합니다."
      eyebrow="API REFERENCE"
      title="Renderer API와 UI adapter"
    >
      <section id="renderer-props">
        <SectionHeading id="renderer-props">Alert와 Confirm Renderer 계약</SectionHeading>
        <DocTable
          caption="AlertRendererProps"
          columns={['필드', '타입', '역할']}
          rows={alertRendererRows}
        />
        <DocTable
          caption="ConfirmRendererProps"
          columns={['필드', '타입', '역할']}
          rows={confirmRendererRows}
        />
        <CodeBlock label="PROVIDER">
          {`const renderers = {
  alert: AlertSurface,
  confirm: ConfirmSurface,
} satisfies OverlayRenderers<AppOverlayRequests>

export function OverlayProvider({ children }: { children: ReactNode }) {
  return (
    <appOverlay.OverlayProvider renderers={renderers}>
      {children}
    </appOverlay.OverlayProvider>
  )
}`}
        </CodeBlock>
        <Callout title="requestClose의 반환 타입이 다른 이유">
          custom <code>OverlaySession.requestClose()</code>는 허용 여부를 boolean으로 반환합니다.
          Confirm Renderer의 <code>requestClose()</code>는 UI event를 전달하는 command이므로
          void이며, Renderer가 Core policy 결과에 따라 자체 open state를 따로 바꾸지 않습니다.
        </Callout>
      </section>

      <section id="responsibility">
        <SectionHeading id="responsibility">UI primitive와 Core의 책임 경계</SectionHeading>
        <DocTable
          caption="Modal adapter 책임"
          columns={['계층', '책임']}
          rows={responsibilityRows}
        />
        <CodeBlock label="EVENT FLOW">
          {`사용자가 ESC 또는 backdrop을 누름
→ UI primitive가 실제 입력을 감지
→ Renderer가 requestClose('escape' | 'outside') 호출
→ Core가 topmost와 호출별 option 확인
→ 허용되면 open=false · phase='closing' · Promise 완료
→ UI primitive가 exit를 실행
→ Renderer가 completeClose() 호출
→ Core가 session을 제거`}
        </CodeBlock>
        <Callout title="close option은 event listener가 아닙니다" tone="warning">
          <code>closeOnEscape</code>와 <code>closeOnOutsidePress</code>는 Renderer가 전달한 요청을
          허용할지 결정합니다. Lyrd가 전역 keyboard·pointer listener를 설치하거나 선택한 primitive에
          없는 dismissal을 새로 만들지는 않습니다.
        </Callout>
      </section>

      <section id="base-ui">
        <SectionHeading id="base-ui">Base UI — 현재 CLI 생성 adapter</SectionHeading>
        <p>
          CLI는 <code>@base-ui/react/alert-dialog</code>의 controlled <code>open</code>, 닫힘 이유가
          포함된 <code>onOpenChange</code>와 animation 완료 callback인{' '}
          <code>onOpenChangeComplete</code>를 사용합니다.
        </p>
        <CodeBlock label="ConfirmSurface.tsx">
          {`import { AlertDialog } from '@base-ui/react/alert-dialog'
import type { ConfirmRendererProps } from '@lyrd/core'

import type { AppConfirmRequest } from '../scope'

export function ConfirmSurface({
  actionStatus,
  cancel,
  completeClose,
  confirm,
  error,
  open,
  request,
  requestClose,
}: ConfirmRendererProps<AppConfirmRequest>) {
  const pending = actionStatus === 'pending'

  function handleCancel() {
    request.onCancel?.()
    cancel()
  }

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(nextOpen, details) =>
        !nextOpen && requestClose(
          details.reason === 'escape-key' ? 'escape' : 'outside',
        )
      }
      onOpenChangeComplete={(nextOpen) =>
        !nextOpen && completeClose()
      }
    >
      <AlertDialog.Portal>
        <AlertDialog.Backdrop />
        <AlertDialog.Popup>
          <AlertDialog.Title>{request.title}</AlertDialog.Title>
          {request.description ? (
            <AlertDialog.Description>
              {request.description}
            </AlertDialog.Description>
          ) : null}
          {error ? <p role="alert">다시 시도해 주세요.</p> : null}
          <button disabled={pending} onClick={handleCancel} type="button">
            {request.cancelLabel ?? '취소'}
          </button>
          <button
            aria-busy={pending}
            disabled={pending}
            onClick={confirm}
            type="button"
          >
            {pending ? '처리 중' : (request.confirmLabel ?? '확인')}
          </button>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}`}
        </CodeBlock>
        <Callout title="Base UI AlertDialog는 outside press로 닫히지 않습니다">
          Core의 Confirm policy가 outside 요청을 기본 허용해도 이 primitive는 사용자 응답을
          요구하므로 outside request를 만들지 않습니다. outside dismissal이 제품 요구사항이면 Base
          UI <code>Dialog</code>처럼 outside 사건을 제공하는 primitive로 Renderer를 교체합니다.
        </Callout>
        <a className="text-link" href="https://base-ui.com/react/components/alert-dialog">
          Base UI Alert Dialog 공식 문서 보기 ↗
        </a>
        <a className="text-link" href="https://base-ui.com/react/components/dialog">
          Base UI Dialog 공식 문서 보기 ↗
        </a>
      </section>

      <section id="radix">
        <SectionHeading id="radix">Radix Dialog — controlled adapter</SectionHeading>
        <p>
          Radix Dialog Root는 controlled <code>open</code>을 지원하고 Content는 ESC와 outside
          pointer 사건을 제공합니다. 각 사건의 기본 동작을 막은 뒤 Core에 요청해야 policy가 거부한
          경우에도 UI가 열린 상태를 유지합니다.
        </p>
        <CodeBlock label="RadixConfirmSurface.tsx">
          {`import { Dialog } from 'radix-ui'
import type { ConfirmRendererProps } from '@lyrd/core'

import type { AppConfirmRequest } from '../scope'

export function RadixConfirmSurface({
  actionStatus,
  cancel,
  completeClose,
  confirm,
  error,
  open,
  request,
  requestClose,
}: ConfirmRendererProps<AppConfirmRequest>) {
  const pending = actionStatus === 'pending'

  return (
    <Dialog.Root open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialogOverlay" />
        <Dialog.Content
          className="dialogContent"
          onAnimationEnd={(event) => {
            if (!open && event.target === event.currentTarget) {
              completeClose()
            }
          }}
          onEscapeKeyDown={(event) => {
            event.preventDefault()
            requestClose('escape')
          }}
          onPointerDownOutside={(event) => {
            event.preventDefault()
            requestClose('outside')
          }}
        >
          <Dialog.Title>{request.title}</Dialog.Title>
          {request.description ? (
            <Dialog.Description>{request.description}</Dialog.Description>
          ) : null}
          {error ? <p role="alert">다시 시도해 주세요.</p> : null}
          <button disabled={pending} onClick={cancel} type="button">
            취소
          </button>
          <button aria-busy={pending} disabled={pending} onClick={confirm} type="button">
            {pending ? '처리 중' : '확인'}
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}`}
        </CodeBlock>
        <CodeBlock label="EXIT CSS">
          {`.dialogOverlay[data-state='closed'],
.dialogContent[data-state='closed'] {
  animation: fade-out 120ms ease-in;
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}`}
        </CodeBlock>
        <ContractList>
          <li>버튼은 Radix Close가 아니라 Lyrd의 confirm·cancel command를 직접 호출합니다.</li>
          <li>Overlay와 Content의 exit 시간을 맞추고 마지막 animation 완료에서 제거합니다.</li>
          <li>
            JS animation이 mount를 관리한다면 Radix의 forceMount와 animation 완료 신호를 연결합니다.
          </li>
        </ContractList>
        <a className="text-link" href="https://www.radix-ui.com/primitives/docs/components/dialog">
          Radix Dialog 공식 문서 보기 ↗
        </a>
        <a className="text-link" href="https://www.radix-ui.com/primitives/docs/guides/animation">
          Radix animation 공식 가이드 보기 ↗
        </a>
      </section>

      <section id="custom-ui">
        <SectionHeading id="custom-ui">자체 UI — lifecycle 최소 adapter</SectionHeading>
        <CodeBlock label="CustomModal.tsx">
          {`import { useOverlaySession } from '@lyrd/core'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

function CustomModal() {
  const { completeClose, open, phase, requestClose } =
    useOverlaySession<Result>()

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') requestClose('escape')
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, requestClose])

  useEffect(() => {
    if (phase === 'closing') completeClose()
  }, [completeClose, phase])

  if (!open) return null

  return createPortal(
    <div
      className="backdrop"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) requestClose('outside')
      }}
    >
      <section
        aria-describedby="modal-description"
        aria-labelledby="modal-title"
        aria-modal="true"
        role="dialog"
      >
        <h2 id="modal-title">제목</h2>
        <p id="modal-description">설명</p>
        <button type="button">작업</button>
      </section>
    </div>,
    document.body,
  )
}`}
        </CodeBlock>
        <Callout title="이 코드는 lifecycle 연결만 보여줍니다" tone="danger">
          production 자체 modal은 focus trap과 최초 focus, 닫힌 뒤 focus 복원, 배경 inert와 scroll
          lock, portal 계층, 중첩 z-index, 접근 가능한 이름·설명과 키보드 탐색을 별도로 구현하고
          테스트해야 합니다. 이를 제공하지 못하면 검증된 Dialog primitive를 사용합니다.
        </Callout>
        <p>
          위 예제는 exit animation이 없어 closing effect에서 즉시 제거합니다. animation이 있다면
          element를 유지하고 transition·animation 완료 callback에서 <code>completeClose()</code>를
          호출합니다.
        </p>
      </section>

      <section id="confirm-state">
        <SectionHeading id="confirm-state">Pending, error, retry와 explicit cancel</SectionHeading>
        <DocSteps items={confirmActionSteps} />
        <CodeBlock label="EXPLICIT CANCEL">
          {`function handleCancel() {
  request.onCancel?.()
  cancel()
}`}
        </CodeBlock>
        <p>
          앱 전용 <code>onCancel</code>은 눈에 보이는 취소 버튼에서만 실행합니다. ESC, outside,
          <code>handle.close()</code>와 route cleanup은 사용자가 그 버튼을 선택한 것이 아니므로
          callback을 실행하지 않습니다.
        </p>
      </section>

      <section id="verification">
        <SectionHeading id="verification">Adapter 검증 체크리스트</SectionHeading>
        <ContractList>
          <li>primitive가 Lyrd의 open만을 source of truth로 사용하는가</li>
          <li>
            ESC와 outside를 구분해 requestClose로 전달하고 policy 거부 시 열린 상태를 유지하는가
          </li>
          <li>모든 exit 경로가 정확히 한 번 completeClose를 호출하는가</li>
          <li>Confirm pending 중 버튼·ESC·outside가 중복 작업을 만들지 않는가</li>
          <li>error가 접근 가능한 상태로 표시되고 같은 confirm command로 재시도되는가</li>
          <li>중첩 modal의 focus, inert, portal과 z-index가 topmost 순서를 따르는가</li>
          <li>닫힌 뒤 focus가 이전 상호작용 위치로 돌아가는가</li>
        </ContractList>
        <RelatedDocs items={rendererRelatedDocs} />
      </section>
    </DocPage>
  )
}
