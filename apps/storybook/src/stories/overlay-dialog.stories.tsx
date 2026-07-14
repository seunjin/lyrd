import { useOverlay } from '@lyrd/core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import {
  DocumentEditorDialog,
  type DocumentEditorResult,
} from '../lyrd/dialogs/document-editor-dialog'
import {
  ProjectSettingsDialog,
  type ProjectSettingsResult,
} from '../lyrd/dialogs/project-settings-dialog'

const meta = {
  title: 'VNext/Overlay Dialog',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function OverlayDialogStory() {
  const overlay = useOverlay()
  const [result, setResult] = useState('-')

  async function runModal() {
    const saved = await overlay.dialog<ProjectSettingsResult>(
      <ProjectSettingsDialog projectId="lyrd" />,
    )
    setResult(saved ? `프로젝트 이름 저장: ${saved.projectName}` : '프로젝트 설정 취소')
  }

  async function runFullscreen() {
    const saved = await overlay.dialog<DocumentEditorResult>(
      <DocumentEditorDialog documentId="rfc-0002" />,
    )
    setResult(saved ? `문서 저장: ${saved.title}` : '문서 편집 취소')
  }

  async function runDuplicate() {
    const first = overlay.dialog<ProjectSettingsResult>(<ProjectSettingsDialog projectId="first" />)
    const duplicate = overlay.dialog<ProjectSettingsResult>(
      <ProjectSettingsDialog projectId="duplicate" />,
    )
    const shared = first === duplicate
    const saved = await duplicate
    setResult(
      `${shared ? '중복 요청 병합' : '중복 요청 분리'} · ${saved ? saved.projectName : '취소'}`,
    )
  }

  async function runDistinctKeys() {
    const first = overlay.dialog<ProjectSettingsResult>(
      <ProjectSettingsDialog key="project-a" projectId="project-a" />,
    )
    const second = overlay.dialog<ProjectSettingsResult>(
      <ProjectSettingsDialog key="project-b" projectId="project-b" />,
    )
    const [firstResult, secondResult] = await Promise.all([first, second])
    setResult(
      `key 대기열 완료 · ${firstResult?.projectName ?? '첫 번째 취소'} / ${secondResult?.projectName ?? '두 번째 취소'}`,
    )
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
        <button onClick={() => void runDuplicate()} type="button">
          같은 Dialog 중복 호출
        </button>
        <button onClick={() => void runDistinctKeys()} type="button">
          다른 key 대기열
        </button>
      </div>
    </div>
  )
}

export const ModalAndFullscreen: Story = {
  render: () => <OverlayDialogStory />,
}
