import { AlertDialog } from '@base-ui/react/alert-dialog'
import type { ConfirmSurfaceProps } from '@lyrd/core'

import './overlay.css'

export function ConfirmSurface({
  cancel,
  completeClose,
  confirm,
  open,
  request,
  requestClose,
  status,
}: ConfirmSurfaceProps) {
  if (!request) return null
  const pending = status === 'pending'

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(nextOpen) => !nextOpen && requestClose()}
      onOpenChangeComplete={(nextOpen) => !nextOpen && completeClose()}
    >
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="docs-overlay-backdrop" />
        <AlertDialog.Viewport className="docs-overlay-viewport">
          <AlertDialog.Popup className="docs-overlay-popup">
            <div className="docs-overlay-copy">
              <p className="docs-overlay-kicker">CONFIRM · {status.toUpperCase()}</p>
              <AlertDialog.Title className="docs-overlay-title">{request.title}</AlertDialog.Title>
              {request.description ? (
                <AlertDialog.Description className="docs-overlay-description">
                  {request.description}
                </AlertDialog.Description>
              ) : null}
              {status === 'error' ? (
                <p className="docs-overlay-error" role="alert">
                  작업을 완료하지 못했습니다. 다시 시도해 주세요.
                </p>
              ) : null}
            </div>
            <div className="docs-overlay-actions">
              <button
                className="docs-overlay-button docs-overlay-button-secondary"
                disabled={pending}
                onClick={cancel}
                type="button"
              >
                {request.cancelLabel ?? '취소'}
              </button>
              <button
                aria-busy={pending}
                className="docs-overlay-button docs-overlay-button-primary"
                data-tone={request.tone ?? 'neutral'}
                disabled={pending}
                onClick={confirm}
                type="button"
              >
                {pending ? <span aria-hidden className="docs-overlay-spinner" /> : null}
                {pending ? '처리 중' : request.confirmLabel}
              </button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
