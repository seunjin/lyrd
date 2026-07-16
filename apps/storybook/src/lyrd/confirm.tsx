'use client'

import { AlertDialog } from '@base-ui/react/alert-dialog'
import type { ConfirmSurfaceProps } from '@lyrd/core'

import './overlay.css'

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
        <AlertDialog.Backdrop className="lyrd-overlay-backdrop" />
        <AlertDialog.Viewport className="lyrd-overlay-viewport">
          <AlertDialog.Popup className="lyrd-overlay-popup">
            <div className="lyrd-overlay-copy">
              <AlertDialog.Title className="lyrd-overlay-title">{request.title}</AlertDialog.Title>
              {request.description ? (
                <AlertDialog.Description className="lyrd-overlay-description">
                  {request.description}
                </AlertDialog.Description>
              ) : null}
              {status === 'error' ? (
                <p className="lyrd-overlay-error" role="alert">
                  작업을 완료하지 못했습니다. 다시 시도해 주세요.
                </p>
              ) : null}
            </div>
            <div className="lyrd-overlay-actions">
              <button
                className="lyrd-overlay-button lyrd-overlay-button-secondary"
                disabled={pending}
                onClick={cancel}
                type="button"
              >
                {request.cancelLabel ?? '취소'}
              </button>
              <button
                aria-busy={pending}
                className="lyrd-overlay-button lyrd-overlay-button-primary"
                data-tone={request.tone ?? 'neutral'}
                disabled={pending}
                onClick={confirm}
                type="button"
              >
                {pending ? <span aria-hidden className="lyrd-overlay-spinner" /> : null}
                {pending ? '처리 중' : request.confirmLabel}
              </button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
