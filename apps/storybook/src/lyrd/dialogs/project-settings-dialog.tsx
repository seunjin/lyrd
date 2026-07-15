'use client'

import { Dialog } from '@base-ui/react/dialog'
import type { OverlayDefinitionComponentProps } from '@lyrd/core'
import { defineOverlay } from '@lyrd/core'
import { useState } from 'react'

import '../dialog.css'

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
        session.requestClose(eventDetails.reason === 'escape-key' ? 'escape' : 'outside')
      }
      onOpenChangeComplete={(nextOpen) => !nextOpen && session.completeClose()}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="lyrd-dialog-backdrop" />
        <Dialog.Viewport className="lyrd-dialog-viewport">
          <Dialog.Popup className="lyrd-dialog-popup">
            <header className="lyrd-dialog-header">
              <div>
                <Dialog.Title className="lyrd-dialog-title">프로젝트 설정</Dialog.Title>
                <Dialog.Description className="lyrd-dialog-description">
                  프로젝트 {projectId}의 이름을 변경합니다.
                </Dialog.Description>
              </div>
              <button
                aria-label="닫기"
                className="lyrd-dialog-icon-button"
                onClick={() => session.dismiss('cancel')}
                type="button"
              >
                ×
              </button>
            </header>

            <label className="lyrd-dialog-field">
              <span>프로젝트 이름</span>
              <input onChange={(event) => setProjectName(event.target.value)} value={projectName} />
            </label>

            <footer className="lyrd-dialog-actions">
              <button
                className="lyrd-dialog-button-secondary"
                onClick={() => session.dismiss('cancel')}
                type="button"
              >
                취소
              </button>
              <button
                className="lyrd-dialog-button-primary"
                onClick={() => session.resolve({ saved: true, projectName })}
                type="button"
              >
                저장
              </button>
            </footer>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export const projectSettingsDialog = defineOverlay(ProjectSettingsDialog)
