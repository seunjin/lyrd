import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { useOverlay } from '../overlays/scope'
import { useScheduledCommand } from './useScheduledCommand'

const meta = {
  title: 'VNext/Overlay Alert',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function OverlayAlertStory() {
  const overlay = useOverlay()
  const schedule = useScheduledCommand()
  const [result, setResult] = useState('-')

  async function runBasic() {
    await overlay.alert({
      title: '저장이 완료되었습니다.',
      description: '변경한 설정이 다음 접속부터 적용됩니다.',
      actionLabel: '알겠어요',
      onAction: () => setResult('onAction 실행'),
    })
    setResult('onAction 실행 후 Alert 완료')
  }

  async function runStack() {
    const lower = overlay.alert({
      title: '아래 Alert',
      description: '위 Confirm이 닫혀도 이 Alert는 mount와 상태를 유지합니다.',
      actionLabel: '아래 Alert 닫기',
    })
    const top = overlay.confirm({
      title: '위 Confirm',
      description: '마지막에 열린 이 Confirm이 먼저 닫히는 LIFO stack입니다.',
      confirmLabel: '먼저 닫기',
      cancelLabel: '취소로 닫기',
    })

    const confirmed = await top
    setResult(`위 Confirm ${confirmed ? '확인' : '취소'} · 아래 Alert 유지 중`)
    await lower
    setResult('LIFO stack 순서로 모두 완료')
  }

  async function runProgrammaticClose() {
    let actionCalled = false
    const handle = overlay.alert({
      title: '1.2초 뒤 handle.close()',
      description: '명시적인 close는 onAction을 실행하지 않습니다.',
      onAction: () => {
        actionCalled = true
      },
    })
    schedule(() => handle.close(), 1200)

    await handle
    setResult(actionCalled ? '잘못됨: onAction 실행' : 'handle.close · onAction 미실행')
  }

  return (
    <div className="lyrd-story">
      <p className="lyrd-story-result">
        결과: <code>{result}</code>
      </p>
      <div className="lyrd-story-actions">
        <button onClick={() => void runBasic()} type="button">
          기본 안내
        </button>
        <button onClick={() => void runStack()} type="button">
          Alert + Confirm LIFO
        </button>
        <button onClick={() => void runProgrammaticClose()} type="button">
          handle.close 확인
        </button>
      </div>
    </div>
  )
}

export const VerticalSlice: Story = {
  render: () => <OverlayAlertStory />,
}
