'use client'

import { Dialog } from '@base-ui/react/dialog'
import type { OverlayDefinitionComponentProps } from '@lyrd/core'
import { defineOverlay } from '@lyrd/core'
import type { ReactNode } from 'react'

import styles from './ConsumerLabDialog.module.css'

export type ConsumerLabDialogResult = {
  completed: true
}

export type ConsumerLabDialogProps = {
  children?: ReactNode
  description?: ReactNode
  title?: ReactNode
}

type ConsumerLabDialogComponentProps = OverlayDefinitionComponentProps<
  ConsumerLabDialogProps,
  ConsumerLabDialogResult
>

function ConsumerLabDialog({ input, session }: ConsumerLabDialogComponentProps) {
  const {
    children,
    description = '이 설명과 화면 내용을 제품 흐름에 맞게 수정하세요.',
    title = 'consumer lab',
  } = input

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
        <Dialog.Popup className={styles.Popup}>
          <header className={styles.Intro}>
            <div>
              <Dialog.Title className={styles.Title}>{title}</Dialog.Title>
              <Dialog.Description className={styles.Description}>{description}</Dialog.Description>
            </div>
          </header>

          {children ? <div className={styles.Content}>{children}</div> : null}

          <footer className={styles.Actions}>
            <button
              className={styles.Button}
              onClick={() => session.dismiss('cancel')}
              type="button"
            >
              취소
            </button>
            <button
              className={styles.Button}
              onClick={() => session.resolve({ completed: true })}
              type="button"
            >
              완료
            </button>
          </footer>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export const consumerLabDialog = defineOverlay(ConsumerLabDialog)
