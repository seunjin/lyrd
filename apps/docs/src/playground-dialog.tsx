import { Dialog } from '@base-ui/react/dialog'
import type { OverlayDefinitionComponentProps } from '@lyrd/core'
import { defineOverlay } from '@lyrd/core'
import { useState } from 'react'

export type PlaygroundDialogResult = {
  name: string
}

export type PlaygroundDialogInput = {
  projectId: string
}

type PlaygroundDialogProps = OverlayDefinitionComponentProps<
  PlaygroundDialogInput,
  PlaygroundDialogResult
>

function PlaygroundDialog({ input, session }: PlaygroundDialogProps) {
  const { projectId } = input
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
        <Dialog.Backdrop className="docs-overlay-backdrop" />
        <Dialog.Viewport className="docs-overlay-viewport">
          <Dialog.Popup className="docs-overlay-popup docs-dialog-popup">
            <div className="docs-overlay-copy">
              <p className="docs-overlay-kicker">CUSTOM DIALOG · {projectId}</p>
              <Dialog.Title className="docs-overlay-title">프로젝트 이름 변경</Dialog.Title>
              <Dialog.Description className="docs-overlay-description">
                이 UI는 패키지가 아니라 문서 앱이 직접 소유합니다.
              </Dialog.Description>
            </div>
            <label className="docs-dialog-field">
              <span>프로젝트 이름</span>
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <div className="docs-overlay-actions">
              <button
                className="docs-overlay-button docs-overlay-button-secondary"
                onClick={() => session.dismiss('cancel')}
                type="button"
              >
                취소
              </button>
              <button
                className="docs-overlay-button docs-overlay-button-primary"
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

export const playgroundDialog = defineOverlay(PlaygroundDialog)
