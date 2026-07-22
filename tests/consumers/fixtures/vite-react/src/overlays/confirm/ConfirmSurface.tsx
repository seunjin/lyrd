'use client'

import { AlertDialog } from '@base-ui/react/alert-dialog'
import type { ConfirmSurfaceProps } from '@lyrd/core'

import styles from './Confirm.module.css'

export function ConfirmSurface({
  cancel,
  completeExit,
  confirm,
  open,
  request,
  requestDismiss,
  status,
}: ConfirmSurfaceProps) {
  if (!request) return null

  const pending = status === 'pending'

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(nextOpen) => !nextOpen && requestDismiss()}
      onOpenChangeComplete={(nextOpen) => !nextOpen && completeExit()}
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
            {status === 'error' ? (
              <p className={styles.Description} role="alert">
                작업을 완료하지 못했습니다. 다시 시도해 주세요.
              </p>
            ) : null}
          </div>
          <div className={styles.Actions}>
            <button className={styles.Button} disabled={pending} onClick={cancel} type="button">
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
              {pending ? '처리 중' : request.confirmLabel}
            </button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
