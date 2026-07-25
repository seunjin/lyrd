import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { ProjectSettingsDialog } from '../overlays/dialogs/project-settings/ProjectSettingsDialog'
import { useOverlay } from '../overlays/scope'
import { useScheduledCommand } from './useScheduledCommand'

const meta = {
  title: 'VNext/Overlay Lifecycle',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function OverlayLifecycleStory() {
  const overlay = useOverlay()
  const schedule = useScheduledCommand()
  const [result, setResult] = useState('-')

  async function runClose() {
    const lower = overlay.alert({
      title: '아래 Alert',
      description: '1.2초 뒤 topmost Confirm만 overlay.close()로 닫힙니다.',
      actionLabel: 'Alert 닫기',
    })
    const top = overlay.confirm({
      title: '위 Confirm',
      description: '자동으로 닫힌 뒤 아래 Alert가 그대로 남아야 합니다.',
    })
    schedule(() => overlay.close(), 1200)

    const confirmed = await top
    setResult(`overlay.close() → Confirm ${confirmed} · Alert 유지 중`)
    await lower
    setResult('overlay.close()가 topmost만 닫음')
  }

  async function runHandleClose() {
    const handle = overlay.open(<ProjectSettingsDialog projectId="exact-session" />)
    schedule(() => handle.close('programmatic'), 1200)

    const outcome = await handle
    setResult(`handle.close() → ${outcome.status}`)
  }

  async function runCloseAll() {
    const alert = overlay.alert({ title: '아래 Alert' })
    const confirm = overlay.confirm({ title: '위 Confirm' })
    schedule(() => overlay.closeAll('route-change'), 1200)

    const [alertResult, confirmResult] = await Promise.all([alert, confirm])
    setResult(`closeAll(route-change) → ${String(alertResult)} / ${confirmResult}`)
  }

  return (
    <div className="lyrd-story">
      <p className="lyrd-story-result">
        결과: <code>{result}</code>
      </p>
      <div className="lyrd-story-actions">
        <button onClick={() => void runClose()} type="button">
          overlay.close topmost
        </button>
        <button onClick={() => void runHandleClose()} type="button">
          handle.close exact
        </button>
        <button onClick={() => void runCloseAll()} type="button">
          closeAll route cleanup
        </button>
      </div>
    </div>
  )
}

export const CloseCommands: Story = {
  render: () => <OverlayLifecycleStory />,
}
