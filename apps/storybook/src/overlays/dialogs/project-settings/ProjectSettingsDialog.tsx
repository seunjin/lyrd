'use client'

import { Dialog } from '@base-ui/react/dialog'
import { useOverlaySession } from '@lyrd/core'
import { useState } from 'react'

import { useOverlay } from '../../scope'
import styles from './ProjectSettingsDialog.module.css'

export type ProjectSettingsResult = {
  saved: true
  projectName: string
}

export type ProjectSettingsInput = {
  projectId: string
}

export function ProjectSettingsDialog({ projectId }: ProjectSettingsInput) {
  const overlay = useOverlay()
  const session = useOverlaySession<ProjectSettingsResult>()
  const [projectName, setProjectName] = useState('Lyrd')
  const [nestedResult, setNestedResult] = useState('열지 않음')

  async function confirmReset() {
    let canceledByButton = false
    const confirmed = await overlay.confirm({
      title: '프로젝트 이름을 초기화할까요?',
      description: '아래 Dialog는 열린 상태와 입력값을 그대로 유지합니다.',
      confirmLabel: '초기화',
      cancelLabel: '유지',
      tone: 'danger',
      onCancel: () => {
        canceledByButton = true
        setNestedResult('취소 버튼 선택')
      },
      onConfirm: () => setProjectName('Lyrd'),
    })
    if (confirmed) setNestedResult('초기화 완료')
    else if (!canceledByButton) setNestedResult('ESC 또는 outside로 닫힘')
  }

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
        <Dialog.Popup className={styles.Popup}>
          <header className={styles.Header}>
            <div>
              <Dialog.Title className={styles.Title}>프로젝트 설정</Dialog.Title>
              <Dialog.Description className={styles.Description}>
                프로젝트 {projectId}의 이름을 변경합니다.
              </Dialog.Description>
            </div>
            <button
              aria-label="닫기"
              className={styles.IconButton}
              onClick={() => session.close('cancel')}
              type="button"
            >
              ×
            </button>
          </header>

          <label className={styles.Field}>
            <span>프로젝트 이름</span>
            <input onChange={(event) => setProjectName(event.target.value)} value={projectName} />
          </label>

          <p className={styles.NestedResult}>중첩 Confirm: {nestedResult}</p>

          <footer className={styles.Actions}>
            <button className={styles.Button} onClick={() => void confirmReset()} type="button">
              중첩 Confirm 열기
            </button>
            <button className={styles.Button} onClick={() => session.close('cancel')} type="button">
              취소
            </button>
            <button
              className={styles.Button}
              onClick={() => session.resolve({ saved: true, projectName })}
              type="button"
            >
              저장
            </button>
          </footer>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
