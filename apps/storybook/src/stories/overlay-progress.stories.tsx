import { useOverlay } from '@lyrd/core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef, useState } from 'react'

import { uploadProgressDialog } from '../lyrd/dialogs/upload-progress-dialog'

const meta = {
  title: 'VNext/Overlay Progress',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const totalBytes = 24 * 1024 * 1024

function wait(duration: number) {
  return new Promise((resolve) => setTimeout(resolve, duration))
}

function OverlayProgressStory() {
  const overlay = useOverlay()
  const nextUploadId = useRef(1)
  const [result, setResult] = useState('-')

  async function runUpload() {
    const uploadId = `storybook-upload-${nextUploadId.current++}`
    const fileName = 'lyrd-demo.mov'
    let settled = false
    const task = overlay.openOrUpdate(
      uploadProgressDialog,
      uploadId,
      { uploadId, fileName, uploadedBytes: 0, totalBytes },
      { dismissPolicy: 'block' },
    )
    void task.then(() => {
      settled = true
    })

    for (let step = 1; step <= 10; step += 1) {
      await wait(240)
      if (settled) break
      task.update({
        uploadId,
        fileName,
        uploadedBytes: Math.round((totalBytes * step) / 10),
        totalBytes,
      })
    }

    const outcome = await task
    setResult(
      outcome.status === 'resolved'
        ? `${outcome.value.uploadId} 완료`
        : `${uploadId} 취소: ${outcome.reason}`,
    )
  }

  return (
    <div className="lyrd-story">
      <p className="lyrd-story-result">
        결과: <code>{result}</code>
      </p>
      <div className="lyrd-story-actions">
        <button onClick={() => void runUpload()} type="button">
          업로드 시작
        </button>
      </div>
    </div>
  )
}

export const IdentityBasedOpenOrUpdate: Story = {
  render: () => <OverlayProgressStory />,
}
