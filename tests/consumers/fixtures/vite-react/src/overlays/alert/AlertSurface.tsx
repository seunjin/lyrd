'use client'

import { AlertDialog } from '@base-ui/react/alert-dialog'
import type { AlertRendererProps } from '@lyrd/core'

import type { AppAlertRequest } from '../scope'
import styles from './Alert.module.css'

export function AlertSurface({
  action,
  completeClose,
  open,
  request,
}: AlertRendererProps<AppAlertRequest>) {
  return (
    <AlertDialog.Root open={open} onOpenChangeComplete={(nextOpen) => !nextOpen && completeClose()}>
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
            <button className={styles.Button} onClick={action} type="button">
              {request.actionLabel ?? '확인'}
            </button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
