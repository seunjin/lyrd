'use client'

import { AlertDialog } from '@base-ui/react/alert-dialog'
import type { AlertRendererProps } from '@lyrd/core'
import { useEffect } from 'react'

import { emitPlaygroundEvent } from '../../playground-events'
import type { AppAlertRequest } from '../scope'
import styles from './Alert.module.css'

export function AlertSurface({
  action,
  completeClose,
  open,
  phase,
  request,
}: AlertRendererProps<AppAlertRequest>) {
  useEffect(() => {
    emitPlaygroundEvent(request.playground, phase)
  }, [phase, request.playground])

  function handleOpenChangeComplete(nextOpen: boolean) {
    if (nextOpen) return
    emitPlaygroundEvent(request.playground, 'removed')
    completeClose()
  }

  return (
    <AlertDialog.Root open={open} onOpenChangeComplete={handleOpenChangeComplete}>
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
