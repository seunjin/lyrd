import { Dialog } from '@base-ui/react/dialog'
import { useOverlayDialog } from '@lyrd/core'
import { useState } from 'react'

export type PlaygroundDialogResult = {
  name: string
}

export function PlaygroundDialog({ projectId }: { projectId: string }) {
  const dialog = useOverlayDialog<PlaygroundDialogResult>()
  const [name, setName] = useState('Lyrd 문서')

  return (
    <Dialog.Root
      open={dialog.open}
      onOpenChange={(nextOpen) => !nextOpen && dialog.requestClose()}
      onOpenChangeComplete={(nextOpen) => !nextOpen && dialog.completeClose()}
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
                onClick={dialog.dismiss}
                type="button"
              >
                취소
              </button>
              <button
                className="docs-overlay-button docs-overlay-button-primary"
                onClick={() => dialog.resolve({ name })}
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
