import { useOverlay } from '@lyrd/core'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { playgroundDialog } from '../playground-dialog'

export function PlaygroundPage() {
  const overlay = useOverlay()
  const [result, setResult] = useState('아직 실행한 오버레이가 없습니다.')
  const asyncAttempts = useRef(0)

  async function showAlert() {
    await overlay.alert({
      title: '배포 준비가 완료되었습니다.',
      description: '품질 게이트 6개가 모두 통과했습니다.',
      acknowledgeLabel: '확인',
    })
    setResult('alert · 사용자가 내용을 확인했습니다.')
  }

  async function showConfirm() {
    const confirmed = await overlay.confirm({
      title: '프로젝트를 삭제할까요?',
      description: '이 데모에서는 실제 데이터가 삭제되지 않습니다.',
      confirmLabel: '삭제',
      cancelLabel: '취소',
      tone: 'danger',
    })
    setResult(`confirm · ${confirmed ? '삭제를 선택했습니다.' : '취소했습니다.'}`)
  }

  async function showAsyncConfirm() {
    asyncAttempts.current = 0
    const confirmed = await overlay.confirm({
      title: '변경사항을 배포할까요?',
      description: '첫 번째 시도는 실패하고, 다시 시도하면 완료됩니다.',
      confirmLabel: '배포',
      cancelLabel: '나중에',
      onConfirm: async () => {
        asyncAttempts.current += 1
        await new Promise((resolve) => setTimeout(resolve, 900))
        if (asyncAttempts.current === 1) throw new Error('데모용 배포 실패')
      },
    })
    setResult(`async confirm · ${confirmed ? '재시도 후 완료했습니다.' : '취소했습니다.'}`)
  }

  async function showDialog() {
    const outcome = await overlay.open(playgroundDialog, { projectId: 'lyrd-docs' })
    setResult(
      outcome.status === 'resolved'
        ? `dialog · “${outcome.value.name}”을 저장했습니다.`
        : `dialog · 저장하지 않았습니다. (${outcome.reason})`,
    )
  }

  return (
    <main className="playground-page" id="main-content">
      <header className="playground-hero section-shell">
        <div>
          <p className="playground-kicker">PLAYGROUND / APP-OWNED RENDERERS</p>
          <h1>요청부터 결과까지 직접 확인하세요.</h1>
        </div>
        <p className="playground-description">
          모든 화면은 문서 앱이 소유한 Base UI renderer입니다. Lyrd는 뒤에서 상태, 결과와 queue를
          관리합니다.
        </p>
      </header>

      <section className="playground-workbench section-shell" aria-label="Overlay 데모">
        <div className="playground-controls">
          <button onClick={() => void showAlert()} type="button">
            <span>01</span>
            <b>Alert</b>
            <small>내용을 인지하고 닫기</small>
            <i aria-hidden>→</i>
          </button>
          <button onClick={() => void showConfirm()} type="button">
            <span>02</span>
            <b>Confirm</b>
            <small>취소 또는 진행 결정</small>
            <i aria-hidden>→</i>
          </button>
          <button onClick={() => void showAsyncConfirm()} type="button">
            <span>03</span>
            <b>Async confirm</b>
            <small>pending · error · retry</small>
            <i aria-hidden>→</i>
          </button>
          <button onClick={() => void showDialog()} type="button">
            <span>04</span>
            <b>Custom dialog</b>
            <small>typed input · outcome</small>
            <i aria-hidden>→</i>
          </button>
        </div>
        <div className="playground-result">
          <span>LAST RESULT</span>
          <p aria-live="polite" className="playground-result-copy">
            {result}
          </p>
          <div>
            <i />
            <span>central overlay queue</span>
            <i />
          </div>
        </div>
      </section>

      <nav aria-label="Playground 관련 문서" className="playground-links section-shell">
        <Link to="/getting-started">직접 연결해 보기 →</Link>
        <Link to="/api/application">Application API 이해하기 →</Link>
        <Link to="/api/renderer">Renderer API 이해하기 →</Link>
      </nav>
    </main>
  )
}
