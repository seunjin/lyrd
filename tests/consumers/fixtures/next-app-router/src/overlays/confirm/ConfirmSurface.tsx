'use client'

import { AlertDialog } from '@base-ui/react/alert-dialog'
import type { ConfirmSurfaceProps } from '@lyrd/core'

const styles = {
  Backdrop:
    'fixed inset-0 min-h-dvh bg-black opacity-20 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 dark:opacity-50 supports-[-webkit-touch-callout:none]:absolute',
  Popup:
    'fixed top-1/2 left-1/2 -mt-8 flex w-96 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 border border-neutral-950 bg-white p-4 text-neutral-950 shadow-[0.25rem_0.25rem_0] shadow-black/12 transition-[scale,opacity] duration-100 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none',
  Intro: 'flex flex-col gap-1',
  Title: 'm-0 text-base font-bold',
  Description: 'm-0 text-sm text-neutral-600 dark:text-neutral-400',
  Actions: 'flex justify-end gap-3',
  Button:
    'flex h-8 items-center justify-center gap-2 border border-neutral-950 bg-white px-3 text-sm leading-none whitespace-nowrap font-normal text-neutral-950 select-none hover:not-data-disabled:bg-neutral-100 active:not-data-disabled:bg-neutral-200 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:not-data-disabled:bg-neutral-800 dark:active:not-data-disabled:bg-neutral-700 data-[color=red]:text-red-700 dark:data-[color=red]:text-red-400 disabled:border-neutral-500 disabled:text-neutral-500 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white',
} as const

export function ConfirmSurface({
  cancel,
  completeExit,
  confirm,
  open,
  request,
  requestDismiss,
  status,
}: ConfirmSurfaceProps) {
  if (!request) return null

  const pending = status === 'pending'

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
            {status === 'error' ? (
              <p className={styles.Description} role="alert">
                작업을 완료하지 못했습니다. 다시 시도해 주세요.
              </p>
            ) : null}
          </div>
          <div className={styles.Actions}>
            <button className={styles.Button} disabled={pending} onClick={cancel} type="button">
              {request.cancelLabel ?? '취소'}
            </button>
            <button
              aria-busy={pending}
              className={styles.Button}
              data-color={request.tone === 'danger' ? 'red' : undefined}
              data-tone={request.tone ?? 'neutral'}
              disabled={pending}
              onClick={confirm}
              type="button"
            >
              {pending ? '처리 중' : request.confirmLabel}
            </button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
