import { AlertDialog } from '@base-ui/react/alert-dialog'
import type { AlertSurfaceProps } from '@lyrd/core'

import './overlay.css'

export function AlertSurface({
  acknowledge,
  completeClose,
  open,
  request,
  requestClose,
}: AlertSurfaceProps) {
  if (!request) return null

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
              <p className="docs-overlay-kicker">ALERT</p>
              <AlertDialog.Title className="docs-overlay-title">{request.title}</AlertDialog.Title>
              {request.description ? (
                <AlertDialog.Description className="docs-overlay-description">
                  {request.description}
                </AlertDialog.Description>
              ) : null}
            </div>
            <div className="docs-overlay-actions">
              <button
                className="docs-overlay-button docs-overlay-button-primary"
                onClick={acknowledge}
                type="button"
              >
                {request.acknowledgeLabel ?? '확인'}
              </button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
