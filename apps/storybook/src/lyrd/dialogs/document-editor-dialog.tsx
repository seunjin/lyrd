'use client'

import { Dialog } from '@base-ui/react/dialog'
import type { OverlayDefinitionComponentProps } from '@lyrd/core'
import { defineOverlay } from '@lyrd/core'
import { useState } from 'react'

import '../dialog.css'

export type DocumentEditorResult = {
  status: 'saved'
  title: string
}

export type DocumentEditorInput = {
  documentId: string
}

type DocumentEditorDialogProps = OverlayDefinitionComponentProps<
  DocumentEditorInput,
  DocumentEditorResult
>

function DocumentEditorDialog({ input, session }: DocumentEditorDialogProps) {
  const { documentId } = input
  const [title, setTitle] = useState('오버레이 UX 설계 노트')
  const [body, setBody] = useState(
    'Lyrd는 UI 프리미티브가 아니라 제품의 오버레이 의도를 중앙에서 관리합니다.',
  )

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
        <Dialog.Viewport className="lyrd-fullscreen-viewport">
          <Dialog.Popup className="lyrd-fullscreen-popup">
            <header className="lyrd-fullscreen-header">
              <div>
                <Dialog.Title className="lyrd-dialog-title">문서 편집</Dialog.Title>
                <Dialog.Description className="lyrd-dialog-description">
                  문서 {documentId} · 풀페이지 로컬 렌더러
                </Dialog.Description>
              </div>
              <div className="lyrd-dialog-actions">
                <button
                  className="lyrd-dialog-button-secondary"
                  onClick={() => session.dismiss('cancel')}
                  type="button"
                >
                  나가기
                </button>
                <button
                  className="lyrd-dialog-button-primary"
                  onClick={() => session.resolve({ status: 'saved', title })}
                  type="button"
                >
                  저장하고 닫기
                </button>
              </div>
            </header>

            <main className="lyrd-fullscreen-content">
              <label className="lyrd-dialog-field">
                <span>제목</span>
                <input onChange={(event) => setTitle(event.target.value)} value={title} />
              </label>
              <label className="lyrd-dialog-field lyrd-dialog-field-grow">
                <span>내용</span>
                <textarea onChange={(event) => setBody(event.target.value)} value={body} />
              </label>
            </main>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export const documentEditorDialog = defineOverlay(DocumentEditorDialog)
