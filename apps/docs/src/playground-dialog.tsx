import { Dialog } from '@base-ui/react/dialog'
import { useOverlaySession } from '@lyrd/core'
import { useEffect, useState } from 'react'
import styles from './playground-dialog.module.css'
import { emitPlaygroundEvent, type PlaygroundInstrumentation } from './playground-events'

export type PlaygroundDialogResult = {
  name: string
}

export type PlaygroundDialogInput = {
  instrumentation?: PlaygroundInstrumentation
  projectId: string
}

export function PlaygroundDialog({ instrumentation, projectId }: PlaygroundDialogInput) {
  const session = useOverlaySession<PlaygroundDialogResult>()
  const [name, setName] = useState('Lyrd 문서')

  useEffect(() => {
    emitPlaygroundEvent(instrumentation, session.phase)
  }, [instrumentation, session.phase])

  function handleOpenChange(nextOpen: boolean, eventDetails: { reason: string }) {
    if (nextOpen) return
    const reason = eventDetails.reason === 'escape-key' ? 'escape' : 'outside'
    emitPlaygroundEvent(instrumentation, 'close-reason', reason)
    session.requestClose(reason)
  }

  function handleOpenChangeComplete(nextOpen: boolean) {
    if (nextOpen) return
    emitPlaygroundEvent(instrumentation, 'removed')
    session.completeClose()
  }

  function cancel() {
    emitPlaygroundEvent(instrumentation, 'close-reason', 'cancel')
    session.close('cancel')
  }

  return (
    <Dialog.Root
      open={session.open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={handleOpenChangeComplete}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.Backdrop} />
        <Dialog.Viewport className={styles.Viewport}>
          <Dialog.Popup className={styles.Popup}>
            <div className={styles.Copy}>
              <p className={styles.Kicker}>CUSTOM DIALOG · {projectId}</p>
              <Dialog.Title className={styles.Title}>프로젝트 이름 변경</Dialog.Title>
              <Dialog.Description className={styles.Description}>
                이 UI는 패키지가 아니라 문서 앱이 직접 소유합니다.
              </Dialog.Description>
            </div>
            <label className={styles.Field}>
              <span>프로젝트 이름</span>
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <div className={styles.Actions}>
              <button className={styles.SecondaryButton} onClick={cancel} type="button">
                취소
              </button>
              <button
                className={styles.PrimaryButton}
                onClick={() => session.resolve({ name })}
                type="button"
              >
                저장
              </button>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
