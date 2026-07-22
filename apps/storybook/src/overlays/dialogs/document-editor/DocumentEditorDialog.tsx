'use client'

import { Dialog } from '@base-ui/react/dialog'
import type { OverlayDefinitionComponentProps } from '@lyrd/core'
import { defineOverlay } from '@lyrd/core'
import { useState } from 'react'

import styles from './DocumentEditorDialog.module.css'

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
        session.requestDismiss(eventDetails.reason === 'escape-key' ? 'escape' : 'outside')
      }
      onOpenChangeComplete={(nextOpen) => !nextOpen && session.completeExit()}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.Backdrop} />
        <Dialog.Viewport className={styles.FullscreenViewport}>
          <Dialog.Popup className={styles.FullscreenPopup}>
            <header className={styles.FullscreenHeader}>
              <div>
                <Dialog.Title className={styles.Title}>문서 편집</Dialog.Title>
                <Dialog.Description className={styles.Description}>
                  문서 {documentId} · 풀페이지 로컬 렌더러
                </Dialog.Description>
              </div>
              <div className={styles.Actions}>
                <button
                  className={styles.SecondaryButton}
                  onClick={() => session.dismiss('cancel')}
                  type="button"
                >
                  나가기
                </button>
                <button
                  className={styles.PrimaryButton}
                  onClick={() => session.resolve({ status: 'saved', title })}
                  type="button"
                >
                  저장하고 닫기
                </button>
              </div>
            </header>

            <main className={styles.FullscreenContent}>
              <label className={styles.Field}>
                <span>제목</span>
                <input onChange={(event) => setTitle(event.target.value)} value={title} />
              </label>
              <label className={`${styles.Field} ${styles.FieldGrow}`}>
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
