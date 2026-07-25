import { Dialog } from '@base-ui/react/dialog'
import { useOverlaySession } from '@lyrd/core'
import { useEffect, useState } from 'react'
import { useOverlay } from './overlays/scope'
import type { PlaygroundDialogResult } from './playground-dialog'
import styles from './playground-dialog.module.css'
import { emitPlaygroundEvent, type PlaygroundInstrumentation } from './playground-events'

export function PlaygroundNestedDialog({
  instrumentation,
  projectId,
}: {
  instrumentation: PlaygroundInstrumentation
  projectId: string
}) {
  const overlay = useOverlay()
  const session = useOverlaySession<PlaygroundDialogResult>()
  const [name, setName] = useState('입력 중인 이름')
  const [nestedResult, setNestedResult] = useState('열지 않음')

  useEffect(() => {
    emitPlaygroundEvent(instrumentation, session.phase)
  }, [instrumentation, session.phase])

  async function confirmReset() {
    const confirmed = await overlay.confirm({
      title: '프로젝트 이름을 초기화할까요?',
      description: '아래 Dialog는 mount와 입력 state를 그대로 유지합니다.',
      confirmLabel: '초기화',
      cancelLabel: '유지',
      tone: 'danger',
      onConfirm: () => setName('Lyrd 문서'),
      playground: {
        onEvent: instrumentation.onEvent,
        surface: 'nested confirm · topmost',
      },
    })

    setNestedResult(confirmed ? '초기화 완료' : '입력값 유지')
  }

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
              <p className={styles.Kicker}>NESTED STACK · {projectId}</p>
              <Dialog.Title className={styles.Title}>중첩 Confirm 실습</Dialog.Title>
              <Dialog.Description className={styles.Description}>
                이름을 바꾼 뒤 Confirm을 열어 아래 state가 유지되는지 확인하세요.
              </Dialog.Description>
            </div>
            <label className={styles.Field}>
              <span>프로젝트 이름</span>
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <p aria-live="polite" className={styles.Status}>
              중첩 결과: {nestedResult}
            </p>
            <div className={styles.Actions}>
              <button
                className={styles.SecondaryButton}
                onClick={() => void confirmReset()}
                type="button"
              >
                중첩 Confirm 열기
              </button>
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
