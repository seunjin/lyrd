import { Dialog } from '@base-ui/react/dialog'
import { useOverlaySession } from '@lyrd/core'
import { useState } from 'react'

import styles from './playground-dialog.module.css'

export type PlaygroundDialogResult = {
  name: string
}

export type PlaygroundDialogInput = {
  projectId: string
}

export function PlaygroundDialog({ projectId }: PlaygroundDialogInput) {
  const session = useOverlaySession<PlaygroundDialogResult>()
  const [name, setName] = useState('Lyrd 문서')

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
              <button
                className={styles.SecondaryButton}
                onClick={() => session.close('cancel')}
                type="button"
              >
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
