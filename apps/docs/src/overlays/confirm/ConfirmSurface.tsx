'use client'

import { AlertDialog } from '@base-ui/react/alert-dialog'
import type { ConfirmRendererProps } from '@lyrd/core'
import { useEffect } from 'react'

import { emitPlaygroundEvent } from '../../playground-events'
import type { AppConfirmRequest } from '../scope'
import styles from './Confirm.module.css'

export function ConfirmSurface({
  actionStatus,
  cancel,
  completeClose,
  confirm,
  error,
  open,
  phase,
  request,
  requestClose,
}: ConfirmRendererProps<AppConfirmRequest>) {
  const pending = actionStatus === 'pending'

  useEffect(() => {
    emitPlaygroundEvent(request.playground, phase)
  }, [phase, request.playground])

  useEffect(() => {
    if (actionStatus !== 'idle') {
      emitPlaygroundEvent(request.playground, actionStatus)
    }
  }, [actionStatus, request.playground])

  function handleCancel() {
    emitPlaygroundEvent(request.playground, 'close-reason', 'cancel')
    request.onCancel?.()
    cancel()
  }

  function handleOpenChange(nextOpen: boolean, eventDetails: { reason: string }) {
    if (nextOpen) return
    const reason = eventDetails.reason === 'escape-key' ? 'escape' : 'outside'
    emitPlaygroundEvent(request.playground, 'close-reason', reason)
    requestClose(reason)
  }

  function handleOpenChangeComplete(nextOpen: boolean) {
    if (nextOpen) return
    emitPlaygroundEvent(request.playground, 'removed')
    completeClose()
  }

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={handleOpenChangeComplete}
    >
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className={styles.Backdrop} />
        <AlertDialog.Popup className={styles.Popup}>
          <div className={styles.Intro}>
            <AlertDialog.Title className={styles.Title}>{request.title}</AlertDialog.Title>
            {request.description ? (
              <AlertDialog.Description className={styles.Description}>
                {request.description}
              </AlertDialog.Description>
            ) : null}
            {actionStatus === 'error' ? (
              <p className={styles.Error} role="alert">
                작업을 완료하지 못했습니다. 다시 시도해 주세요.
                {error instanceof Error ? ` (${error.message})` : null}
              </p>
            ) : null}
          </div>
          <div className={styles.Actions}>
            <button
              className={styles.Button}
              disabled={pending}
              onClick={handleCancel}
              type="button"
            >
              {request.cancelLabel ?? '취소'}
            </button>
            <button
              aria-busy={pending}
              className={styles.Button}
              data-color={request.tone === 'danger' ? 'red' : undefined}
              data-tone={request.tone ?? 'neutral'}
              disabled={pending}
              onClick={confirm}
              type="button"
            >
              {pending ? '처리 중' : (request.confirmLabel ?? '확인')}
            </button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
