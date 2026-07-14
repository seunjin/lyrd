'use client'

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
            </div>
            <div className="lyrd-overlay-actions">
              <button
                className="lyrd-overlay-button lyrd-overlay-button-primary"
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
