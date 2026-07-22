'use client'

import { Dialog } from '@base-ui/react/dialog'
import type { OverlayDefinitionComponentProps } from '@lyrd/core'
import { defineOverlay } from '@lyrd/core'
import { useState } from 'react'

import styles from './ProjectSettingsDialog.module.css'

export type ProjectSettingsResult = {
  saved: true
  projectName: string
}

export type ProjectSettingsInput = {
  projectId: string
}

type ProjectSettingsDialogProps = OverlayDefinitionComponentProps<
  ProjectSettingsInput,
  ProjectSettingsResult
>

function ProjectSettingsDialog({ input, session }: ProjectSettingsDialogProps) {
  const { projectId } = input
  const [projectName, setProjectName] = useState('Lyrd')

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
              onClick={() => session.dismiss('cancel')}
              type="button"
            >
              ×
            </button>
          </header>

          <label className={styles.Field}>
            <span>프로젝트 이름</span>
            <input onChange={(event) => setProjectName(event.target.value)} value={projectName} />
          </label>

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

export const projectSettingsDialog = defineOverlay(ProjectSettingsDialog)
