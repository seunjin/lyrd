'use client'

import { AlertDialog } from '@base-ui/react/alert-dialog'
import type { AlertSurfaceProps } from '@lyrd/core'

import styles from './Alert.module.css'

export function AlertSurface({
  acknowledge,
  completeExit,
  open,
  request,
  requestDismiss,
}: AlertSurfaceProps) {
  if (!request) return null

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
          </div>
          <div className={styles.Actions}>
            <button className={styles.Button} onClick={acknowledge} type="button">
              {request.acknowledgeLabel ?? '확인'}
            </button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
