import { useOverlay } from '@lyrd/core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { notify, notifyWithUndo, showToast as openToast } from '../lyrd/notify'

const meta = {
  title: 'VNext/Overlay Toast',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function OverlayToastStory() {
  const overlay = useOverlay()
  const [result, setResult] = useState('-')

  async function showToast(index: number) {
    const outcome = await openToast(overlay, {
      title: `문서 ${index}을 저장했습니다.`,
      description: '각 알림은 독립적으로 닫히며 modal queue를 막지 않습니다.',
    })
    setResult(
      outcome.status === 'resolved' ? `raw · ${outcome.value.action}` : `raw · ${outcome.reason}`,
    )
  }

  function showBurst() {
    for (let index = 1; index <= 6; index += 1) {
      notify(overlay, {
        title: `병렬 Toast ${index}`,
        description: 'limit을 넘는 Toast는 data-limited로 숨겨집니다.',
      })
    }
  }

  async function showUndoToast() {
    const action = await notifyWithUndo(overlay, {
      title: '문서를 삭제했습니다.',
      description: '실행 취소를 선택하면 resolved action을 반환합니다.',
    })
    setResult(`actionable · ${action}`)
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
        <button
          onClick={() =>
            notify(overlay, {
              title: '저장했습니다.',
              description: '단순 알림에는 Undo 버튼이 없습니다.',
            })
          }
          type="button"
        >
          단순 notify()
        </button>
        <button onClick={() => void showUndoToast()} type="button">
          Undo Toast
        </button>
        <button onClick={showBurst} type="button">
          Toast 6개 limit 검증
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
