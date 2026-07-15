import { useOverlay } from '@lyrd/core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef, useState } from 'react'

import { appToast, toastGroup } from '../lyrd/toast'

const meta = {
  title: 'VNext/Overlay Toast',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function OverlayToastStory() {
  const overlay = useOverlay()
  const nextToastId = useRef(1)
  const [result, setResult] = useState('-')

  async function showToast(index: number) {
    const toastId = `storybook-toast-${nextToastId.current++}`
    const outcome = await overlay.open(
      appToast,
      {
        toastId,
        title: `문서 ${index}을 저장했습니다.`,
        description: '각 알림은 독립적으로 닫히며 modal queue를 막지 않습니다.',
      },
      { group: toastGroup },
    )
    setResult(
      outcome.status === 'resolved'
        ? `${toastId} · ${outcome.value.action}`
        : `${toastId} · ${outcome.reason}`,
    )
  }

  function showBurst() {
    for (let index = 1; index <= 3; index += 1) void showToast(index)
  }

  async function showAlongsideConfirm() {
    void showToast(1)
    const confirmed = await overlay.confirm({
      title: 'Toast와 modal을 함께 표시할까요?',
      description: 'parallel group은 기본 modal queue와 독립적으로 렌더링됩니다.',
      confirmLabel: '확인',
      cancelLabel: '취소',
    })
    setResult(`confirm · ${confirmed ? '확인' : '취소'}`)
  }

  return (
    <div className="lyrd-story">
      <p className="lyrd-story-result">
        마지막 결과: <code>{result}</code>
      </p>
      <div className="lyrd-story-actions">
        <button onClick={showBurst} type="button">
          Toast 3개 동시에 열기
        </button>
        <button onClick={() => void showAlongsideConfirm()} type="button">
          Toast와 confirm 함께 열기
        </button>
      </div>
    </div>
  )
}

export const ParallelGroup: Story = {
  render: () => <OverlayToastStory />,
}
