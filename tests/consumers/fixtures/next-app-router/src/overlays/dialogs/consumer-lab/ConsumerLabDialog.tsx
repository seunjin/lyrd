'use client'

import { Dialog } from '@base-ui/react/dialog'
import type { OverlayDefinitionComponentProps } from '@lyrd/core'
import { defineOverlay } from '@lyrd/core'
import type { ReactNode } from 'react'

const styles = {
  Backdrop:
    'fixed inset-0 min-h-dvh bg-black opacity-20 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 dark:opacity-50 supports-[-webkit-touch-callout:none]:absolute',
  Popup:
    'fixed top-1/2 left-1/2 -mt-8 flex w-96 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 border border-neutral-950 bg-white p-4 text-neutral-950 shadow-[0.25rem_0.25rem_0] shadow-black/12 transition-[scale,opacity] duration-100 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none',
  Intro: 'flex flex-col gap-1',
  Title: 'm-0 text-base font-bold',
  Description: 'm-0 text-sm text-neutral-600 dark:text-neutral-400',
  Content: 'min-w-0',
  Actions: 'flex justify-end gap-3',
  Button:
    'flex h-8 items-center justify-center gap-2 border border-neutral-950 bg-white px-3 text-sm leading-none whitespace-nowrap font-normal text-neutral-950 select-none hover:not-data-disabled:bg-neutral-100 active:not-data-disabled:bg-neutral-200 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:not-data-disabled:bg-neutral-800 dark:active:not-data-disabled:bg-neutral-700 data-[color=red]:text-red-700 dark:data-[color=red]:text-red-400 disabled:border-neutral-500 disabled:text-neutral-500 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white',
} as const

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
