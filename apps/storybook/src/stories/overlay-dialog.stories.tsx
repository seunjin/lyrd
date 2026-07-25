import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import {
  DocumentEditorDialog,
  type DocumentEditorResult,
} from '../overlays/dialogs/document-editor/DocumentEditorDialog'
import {
  ProjectSettingsDialog,
  type ProjectSettingsResult,
} from '../overlays/dialogs/project-settings/ProjectSettingsDialog'
import { useOverlay } from '../overlays/scope'

const meta = {
  title: 'VNext/Overlay Dialog',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function OverlayDialogStory() {
  const overlay = useOverlay()
  const [result, setResult] = useState('-')

  async function runModal() {
    const outcome = await overlay.open<ProjectSettingsResult>(
      <ProjectSettingsDialog projectId="lyrd" />,
    )
    setResult(
      outcome.status === 'resolved'
        ? `프로젝트 이름 저장: ${outcome.value.projectName}`
        : `프로젝트 설정 취소: ${outcome.reason}`,
    )
  }

  async function runFullscreen() {
    const outcome = await overlay.open<DocumentEditorResult>(
      <DocumentEditorDialog documentId="rfc-0004" />,
    )
    setResult(
      outcome.status === 'resolved'
        ? `문서 저장: ${outcome.value.title}`
        : `문서 편집 취소: ${outcome.reason}`,
    )
  }

  return (
    <div className="lyrd-story">
      <p className="lyrd-story-result">
        결과: <code>{result}</code>
      </p>
      <div className="lyrd-story-actions">
        <button onClick={() => void runModal()} type="button">
          모달 + 중첩 Confirm
        </button>
        <button onClick={() => void runFullscreen()} type="button">
          풀페이지 편집기
        </button>
      </div>
    </div>
  )
}

export const ModalAndFullscreen: Story = {
  render: () => <OverlayDialogStory />,
}
