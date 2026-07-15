'use client'

import { Dialog } from '@base-ui/react/dialog'
import type { OverlayDefinitionComponentProps } from '@lyrd/core'
import { defineOverlay } from '@lyrd/core'
import { useEffect } from 'react'

import '../dialog.css'

export type UploadProgressInput = {
  uploadId: string
  fileName: string
  uploadedBytes: number
  totalBytes: number
}

export type UploadProgressResult = {
  uploadId: string
  uploadedBytes: number
}

type UploadProgressDialogProps = OverlayDefinitionComponentProps<
  UploadProgressInput,
  UploadProgressResult
>

function UploadProgressDialog({ input, session }: UploadProgressDialogProps) {
  const { fileName, uploadedBytes, totalBytes, uploadId } = input
  const progress = totalBytes === 0 ? 1 : Math.min(uploadedBytes / totalBytes, 1)
  const percent = Math.round(progress * 100)

  useEffect(() => {
    if (!session.open || progress < 1) return
    session.resolve({ uploadId, uploadedBytes })
  }, [progress, session.open, session.resolve, uploadId, uploadedBytes])

  return (
    <Dialog.Root
      open={session.open}
      onOpenChange={(nextOpen, eventDetails) =>
        !nextOpen &&
        session.requestClose(eventDetails.reason === 'escape-key' ? 'escape' : 'outside')
      }
      onOpenChangeComplete={(nextOpen) => !nextOpen && session.completeClose()}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="lyrd-dialog-backdrop" />
        <Dialog.Viewport className="lyrd-dialog-viewport">
          <Dialog.Popup className="lyrd-dialog-popup lyrd-progress-popup">
            <header>
              <Dialog.Title className="lyrd-dialog-title">파일 업로드</Dialog.Title>
              <Dialog.Description className="lyrd-dialog-description">
                {fileName}을 업로드하고 있습니다. 완료될 때까지 이 창을 유지합니다.
              </Dialog.Description>
            </header>

            <div className="lyrd-progress-content">
              <div className="lyrd-progress-label">
                <span>업로드 진행률</span>
                <strong>{percent}%</strong>
              </div>
              <progress aria-label={`${fileName} 업로드 진행률`} max={1} value={progress} />
              <code>{uploadId}</code>
            </div>

            <footer className="lyrd-dialog-actions">
              <button
                className="lyrd-dialog-button-secondary"
                onClick={() => session.dismiss('cancel')}
                type="button"
              >
                업로드 취소
              </button>
            </footer>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export const uploadProgressDialog = defineOverlay(UploadProgressDialog)
