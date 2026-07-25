import type { OverlayHandle, OverlayOutcome } from '@lyrd/core'
import { useState } from 'react'

import {
  ConsumerLabDialog,
  type ConsumerLabDialogResult,
} from './overlays/dialogs/consumer-lab/ConsumerLabDialog'
import { useOverlay } from './overlays/scope'

type DialogOutcome = OverlayOutcome<ConsumerLabDialogResult>
type DialogHandle = OverlayHandle<DialogOutcome>

function closeReason(outcome: DialogOutcome): string {
  return outcome.status === 'resolved' ? 'resolved' : outcome.reason
}

function NestedConfirmButton({ onResult }: { onResult: (result: boolean) => void }) {
  const overlay = useOverlay()

  async function openNestedConfirm() {
    const confirmed = await overlay.confirm({
      title: 'Nested confirm',
      confirmLabel: '중첩 확인',
      cancelLabel: '중첩 취소',
    })
    onResult(confirmed)
  }

  return (
    <button
      data-testid="open-nested-confirm"
      onClick={() => void openNestedConfirm()}
      type="button"
    >
      Open nested confirm
    </button>
  )
}

function StackControls({ closeLower }: { closeLower: () => void }) {
  const overlay = useOverlay()

  return (
    <>
      <button data-testid="handle-close" onClick={closeLower} type="button">
        Close lower by handle
      </button>
      <button
        data-testid="client-close"
        onClick={() => overlay.close('programmatic')}
        type="button"
      >
        Close top by client
      </button>
    </>
  )
}

function CloseAllControl() {
  const overlay = useOverlay()

  return (
    <button
      data-testid="client-close-all"
      onClick={() => overlay.closeAll('route-change')}
      type="button"
    >
      Close all overlays
    </button>
  )
}

export function App() {
  const overlay = useOverlay()
  const [alertResult, setAlertResult] = useState('idle')
  const [confirmResult, setConfirmResult] = useState('idle')
  const [cancelResult, setCancelResult] = useState('idle')
  const [retryResult, setRetryResult] = useState('idle')
  const [customResult, setCustomResult] = useState('idle')
  const [nestedResult, setNestedResult] = useState('idle')
  const [nestedOuterResult, setNestedOuterResult] = useState('idle')
  const [handleCloseResult, setHandleCloseResult] = useState('idle')
  const [clientCloseResult, setClientCloseResult] = useState('idle')
  const [closeAllResult, setCloseAllResult] = useState('idle')

  function openAlert() {
    setAlertResult('waiting')
    void overlay
      .alert({
        title: 'Alert contract',
        description: 'Alert action과 onAction의 역할을 확인합니다.',
        onAction: () => setAlertResult('action'),
      })
      .then(() => setAlertResult((current) => `${current}:resolved`))
  }

  function openPendingConfirm() {
    setConfirmResult('waiting')
    void overlay
      .confirm({
        title: 'Pending confirm',
        confirmLabel: '저장',
        cancelLabel: '취소',
        onConfirm: () => new Promise<void>((resolve) => window.setTimeout(resolve, 200)),
      })
      .then((result) => setConfirmResult(String(result)))
  }

  function openCancelConfirm() {
    let canceledByButton = false
    setCancelResult('waiting')
    void overlay
      .confirm({
        title: 'Cancel confirm',
        confirmLabel: '진행',
        cancelLabel: '취소',
        onCancel: () => {
          canceledByButton = true
        },
      })
      .then((result) =>
        setCancelResult(`callback:${String(canceledByButton)},result:${String(result)}`),
      )
  }

  function openRetryConfirm() {
    let attempts = 0
    setRetryResult('waiting')
    void overlay
      .confirm({
        title: 'Retry confirm',
        confirmLabel: '재시도',
        cancelLabel: '취소',
        onConfirm: async () => {
          attempts += 1
          if (attempts === 1) throw new Error('first attempt failed')
        },
      })
      .then((result) => setRetryResult(`result:${String(result)},attempts:${String(attempts)}`))
  }

  function openCustomDialog() {
    setCustomResult('waiting')
    void overlay
      .open<ConsumerLabDialogResult>(<ConsumerLabDialog title="Custom result dialog" />)
      .then((outcome) =>
        setCustomResult(
          outcome.status === 'resolved'
            ? `resolved:${String(outcome.value.completed)}`
            : `closed:${outcome.reason}`,
        ),
      )
  }

  function openNestedDialog() {
    setNestedResult('waiting')
    setNestedOuterResult('waiting')
    void overlay
      .open<ConsumerLabDialogResult>(
        <ConsumerLabDialog title="Nested parent dialog">
          <NestedConfirmButton onResult={(result) => setNestedResult(String(result))} />
        </ConsumerLabDialog>,
      )
      .then((outcome) => setNestedOuterResult(closeReason(outcome)))
  }

  function observeHandle(handle: DialogHandle, onClose: (reason: string) => void) {
    void handle.then((outcome) => onClose(closeReason(outcome)))
  }

  function openCloseStack() {
    setHandleCloseResult('waiting')
    setClientCloseResult('waiting')
    const lower = overlay.open<ConsumerLabDialogResult>(
      <ConsumerLabDialog title="Handle close target" />,
    )
    const top = overlay.open<ConsumerLabDialogResult>(
      <ConsumerLabDialog title="Client close target">
        <StackControls closeLower={() => lower.close('cancel')} />
      </ConsumerLabDialog>,
    )

    observeHandle(lower, setHandleCloseResult)
    observeHandle(top, setClientCloseResult)
  }

  function openCloseAllStack() {
    setCloseAllResult('waiting')
    const first = overlay.open<ConsumerLabDialogResult>(
      <ConsumerLabDialog title="Close all lower" />,
    )
    const second = overlay.open<ConsumerLabDialogResult>(
      <ConsumerLabDialog title="Close all top">
        <CloseAllControl />
      </ConsumerLabDialog>,
    )

    void Promise.all([first, second]).then((outcomes) =>
      setCloseAllResult(outcomes.map(closeReason).join(',')),
    )
  }

  return (
    <main>
      <h1>Lyrd Vite consumer</h1>
      <section>
        <button data-testid="open-alert" onClick={openAlert} type="button">
          Open alert
        </button>
        <output data-testid="alert-result">{alertResult}</output>
      </section>
      <section>
        <button data-testid="open-confirm" onClick={openPendingConfirm} type="button">
          Open pending confirm
        </button>
        <output data-testid="confirm-result">{confirmResult}</output>
      </section>
      <section>
        <button data-testid="open-cancel-confirm" onClick={openCancelConfirm} type="button">
          Open cancel confirm
        </button>
        <output data-testid="cancel-result">{cancelResult}</output>
      </section>
      <section>
        <button data-testid="open-retry-confirm" onClick={openRetryConfirm} type="button">
          Open retry confirm
        </button>
        <output data-testid="retry-result">{retryResult}</output>
      </section>
      <section>
        <button data-testid="open-custom" onClick={openCustomDialog} type="button">
          Open custom dialog
        </button>
        <output data-testid="custom-result">{customResult}</output>
      </section>
      <section>
        <button data-testid="open-nested" onClick={openNestedDialog} type="button">
          Open nested dialog
        </button>
        <output data-testid="nested-result">{nestedResult}</output>
        <output data-testid="nested-outer-result">{nestedOuterResult}</output>
      </section>
      <section>
        <button data-testid="open-close-stack" onClick={openCloseStack} type="button">
          Open close stack
        </button>
        <output data-testid="handle-close-result">{handleCloseResult}</output>
        <output data-testid="client-close-result">{clientCloseResult}</output>
      </section>
      <section>
        <button data-testid="open-close-all" onClick={openCloseAllStack} type="button">
          Open closeAll stack
        </button>
        <output data-testid="close-all-result">{closeAllResult}</output>
      </section>
    </main>
  )
}
