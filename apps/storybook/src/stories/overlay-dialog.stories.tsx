import { useOverlay } from '@lyrd/core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { documentEditorDialog } from '../lyrd/dialogs/document-editor-dialog'
import { projectSettingsDialog } from '../lyrd/dialogs/project-settings-dialog'

const meta = {
  title: 'VNext/Overlay Dialog',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function OverlayDialogStory() {
  const overlay = useOverlay()
  const [result, setResult] = useState('-')

  async function runModal() {
    const outcome = await overlay.open(projectSettingsDialog, { projectId: 'lyrd' })
    setResult(
      outcome.status === 'resolved'
        ? `프로젝트 이름 저장: ${outcome.value.projectName}`
        : `프로젝트 설정 취소: ${outcome.reason}`,
    )
  }

  async function runFullscreen() {
    const outcome = await overlay.open(documentEditorDialog, { documentId: 'rfc-0003' })
    setResult(
      outcome.status === 'resolved'
        ? `문서 저장: ${outcome.value.title}`
        : `문서 편집 취소: ${outcome.reason}`,
    )
  }

  async function runQueue() {
    const first = overlay.open(projectSettingsDialog, { projectId: 'project-a' })
    const second = overlay.open(projectSettingsDialog, { projectId: 'project-b' })
    const [firstResult, secondResult] = await Promise.all([first, second])
    setResult(`독립 호출 대기열 완료 · ${firstResult.status} / ${secondResult.status}`)
  }

  return (
    <div className="lyrd-story">
      <p className="lyrd-story-result">
        결과: <code>{result}</code>
      </p>
      <div className="lyrd-story-actions">
        <button onClick={() => void runModal()} type="button">
          기본 모달
        </button>
        <button onClick={() => void runFullscreen()} type="button">
          풀페이지 편집기
        </button>
        <button onClick={() => void runQueue()} type="button">
          같은 정의 2회 호출
        </button>
      </div>
    </div>
  )
}

export const ModalAndFullscreen: Story = {
  render: () => <OverlayDialogStory />,
}
