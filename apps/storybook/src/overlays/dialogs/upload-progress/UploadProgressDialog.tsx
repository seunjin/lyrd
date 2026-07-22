'use client'

import { Dialog } from '@base-ui/react/dialog'
import type { OverlayDefinitionComponentProps } from '@lyrd/core'
import { defineOverlay } from '@lyrd/core'
import { useEffect } from 'react'

import styles from './UploadProgressDialog.module.css'

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
        session.requestDismiss(eventDetails.reason === 'escape-key' ? 'escape' : 'outside')
      }
      onOpenChangeComplete={(nextOpen) => !nextOpen && session.completeExit()}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.Backdrop} />
        <Dialog.Popup className={`${styles.Popup} ${styles.ProgressPopup}`}>
          <header>
            <Dialog.Title className={styles.Title}>파일 업로드</Dialog.Title>
            <Dialog.Description className={styles.Description}>
              {fileName}을 업로드하고 있습니다. 완료될 때까지 이 창을 유지합니다.
            </Dialog.Description>
          </header>

          <div className={styles.ProgressContent}>
            <div className={styles.ProgressLabel}>
              <span>업로드 진행률</span>
              <strong>{percent}%</strong>
            </div>
            <progress aria-label={`${fileName} 업로드 진행률`} max={1} value={progress} />
            <code>{uploadId}</code>
          </div>

          <footer className={styles.Actions}>
            <button
              className={styles.Button}
              onClick={() => session.dismiss('cancel')}
              type="button"
            >
              업로드 취소
            </button>
          </footer>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export const uploadProgressDialog = defineOverlay(UploadProgressDialog)
