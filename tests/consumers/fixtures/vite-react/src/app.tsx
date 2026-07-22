import type { OverlayHandle } from '@lyrd/core'
import { useOverlay } from '@lyrd/core'
import { useRef, useState } from 'react'

import {
  type ConsumerLabDialogProps,
  type ConsumerLabDialogResult,
  consumerLabDialog,
} from './overlays/dialogs/consumer-lab/ConsumerLabDialog'
import { showToast } from './overlays/toast/notify'

type LabHandle = OverlayHandle<ConsumerLabDialogProps, ConsumerLabDialogResult>

function outcomeLabel(outcome: Awaited<LabHandle>): string {
  return outcome.status === 'resolved'
    ? `resolved:${String(outcome.value.completed)}`
    : `dismissed:${outcome.reason}`
}

export function App() {
  const overlay = useOverlay()
  const handleRef = useRef<LabHandle | null>(null)
  const identityHandleRef = useRef<LabHandle | null>(null)
  const [alertResult, setAlertResult] = useState('idle')
  const [confirmResult, setConfirmResult] = useState('idle')
  const [handleResult, setHandleResult] = useState('idle')
  const [identityResult, setIdentityResult] = useState('idle')
  const [queueResult, setQueueResult] = useState('idle')
  const [toastResult, setToastResult] = useState('idle')

  function openAlert() {
    void overlay
      .alert({ title: 'Alert contract', description: 'Alert renderer result' })
      .then(() => {
        setAlertResult('resolved')
      })
  }

  function openConfirm() {
    void overlay
      .confirm({ title: 'Confirm contract', confirmLabel: '진행', cancelLabel: '취소' })
      .then((result) => setConfirmResult(String(result)))
  }

  function startQueue() {
    const first = overlay.open(consumerLabDialog, { title: 'Queue first' })
    const second = overlay.open(consumerLabDialog, { title: 'Queue second' })

    void Promise.all([first, second]).then((outcomes) => {
      setQueueResult(outcomes.map(outcomeLabel).join(','))
    })
  }

  function startHandle() {
    const handle = overlay.open(consumerLabDialog, {
      title: 'Handle before update',
      children: (
        <button data-testid="dialog-update-handle" onClick={updateHandle} type="button">
          Update from dialog
        </button>
      ),
    })
    handleRef.current = handle
    setHandleResult(`awaitable:${String(handle instanceof Promise)}`)
    void handle.then((outcome) => setHandleResult(outcomeLabel(outcome)))
  }

  function updateHandle() {
    const updated =
      handleRef.current?.update({
        title: 'Handle after update',
        children: (
          <button data-testid="dialog-dismiss-handle" onClick={dismissHandle} type="button">
            Dismiss from dialog
          </button>
        ),
      }) ?? false
    setHandleResult(`updated:${String(updated)}`)
  }

  function dismissHandle() {
    const dismissed = handleRef.current?.dismiss('programmatic') ?? false
    setHandleResult(`dismiss-requested:${String(dismissed)}`)
  }

  function startIdentity() {
    const first = overlay.openOrUpdate(consumerLabDialog, 'same-consumer', {
      title: 'Identity before update',
    })
    const second = overlay.openOrUpdate(consumerLabDialog, 'same-consumer', {
      title: 'Identity after update',
      children: (
        <button data-testid="dialog-dismiss-identity" onClick={dismissIdentity} type="button">
          Dismiss identity from dialog
        </button>
      ),
    })

    identityHandleRef.current = second
    setIdentityResult(`same:${String(first === second)}`)
    void second.then((outcome) => setIdentityResult(outcomeLabel(outcome)))
  }

  function dismissIdentity() {
    identityHandleRef.current?.dismiss('programmatic')
  }

  function startToasts() {
    const first = showToast(overlay, { title: 'Parallel toast one', timeout: 0 })
    const second = showToast(overlay, { title: 'Parallel toast two', timeout: 0 })
    setToastResult('opened:2')

    void Promise.all([first, second]).then((outcomes) => {
      setToastResult(
        outcomes
          .map((outcome) =>
            outcome.status === 'resolved' ? 'resolved' : `dismissed:${outcome.reason}`,
          )
          .join(','),
      )
    })
  }

  function dismissAll() {
    overlay.dismissAll('programmatic')
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
        <button data-testid="open-confirm" onClick={openConfirm} type="button">
          Open confirm
        </button>
        <output data-testid="confirm-result">{confirmResult}</output>
      </section>
      <section>
        <button data-testid="start-queue" onClick={startQueue} type="button">
          Start queue
        </button>
        <output data-testid="queue-result">{queueResult}</output>
      </section>
      <section>
        <button data-testid="start-handle" onClick={startHandle} type="button">
          Start handle
        </button>
        <button data-testid="update-handle" onClick={updateHandle} type="button">
          Update handle
        </button>
        <button data-testid="dismiss-handle" onClick={dismissHandle} type="button">
          Dismiss handle
        </button>
        <output data-testid="handle-result">{handleResult}</output>
      </section>
      <section>
        <button data-testid="start-identity" onClick={startIdentity} type="button">
          Start identity
        </button>
        <button data-testid="dismiss-identity" onClick={dismissIdentity} type="button">
          Dismiss identity
        </button>
        <output data-testid="identity-result">{identityResult}</output>
      </section>
      <section>
        <p>CSS Modules · Base UI 기본 limit 3 · hover/focus 시 stack이 펼쳐집니다.</p>
        <button data-testid="start-toasts" onClick={startToasts} type="button">
          Start toasts
        </button>
        <button data-testid="dismiss-all" onClick={dismissAll} type="button">
          Dismiss all
        </button>
        <output data-testid="toast-result">{toastResult}</output>
      </section>
    </main>
  )
}
