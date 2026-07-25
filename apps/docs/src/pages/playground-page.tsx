import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { PlaygroundDemoPicker } from '../components/playground-demo-picker'
import { PlaygroundEventLog } from '../components/playground-event-log'
import { PlaygroundLesson } from '../components/playground-lesson'
import { type PlaygroundResult, PlaygroundResultPanel } from '../components/playground-result-panel'
import { useOverlay } from '../overlays/scope'
import { findPlaygroundDemo } from '../playground-data'
import { PlaygroundDialog, type PlaygroundDialogResult } from '../playground-dialog'
import type { PlaygroundDemoId, PlaygroundEvent, PlaygroundEventInput } from '../playground-events'
import { PlaygroundNestedDialog } from '../playground-nested-dialog'

export function PlaygroundPage() {
  const overlay = useOverlay()
  const [activeDemo, setActiveDemo] = useState<PlaygroundDemoId>('alert')
  const [events, setEvents] = useState<PlaygroundEvent[]>([])
  const [result, setResult] = useState<PlaygroundResult | null>(null)
  const [running, setRunning] = useState(false)
  const asyncAttempts = useRef(0)
  const nextEventId = useRef(0)
  const rootSurface = useRef('')
  const lastCloseReason = useRef('')
  const runningRef = useRef(false)
  const selectedDemo = findPlaygroundDemo(activeDemo)

  function finishRun() {
    runningRef.current = false
    rootSurface.current = ''
    setRunning(false)
  }

  function recordEvent(event: PlaygroundEventInput) {
    if (event.state === 'close-reason') {
      lastCloseReason.current = event.detail ?? ''
    }

    if (event.state === 'removed' && event.surface === rootSurface.current) {
      finishRun()
    }

    setEvents((current) => {
      const previous = current.at(-1)
      if (
        previous?.state === event.state &&
        previous.surface === event.surface &&
        previous.detail === event.detail
      ) {
        return current
      }

      nextEventId.current += 1
      return [...current, { ...event, id: nextEventId.current }]
    })
  }

  function beginRun(demo: PlaygroundDemoId, surface: string): boolean {
    if (runningRef.current) return false

    runningRef.current = true
    rootSurface.current = surface
    lastCloseReason.current = ''
    nextEventId.current = 0
    setActiveDemo(demo)
    setEvents([])
    setResult(null)
    setRunning(true)
    return true
  }

  async function showAlert() {
    const surface = 'alert · topmost'
    if (!beginRun('alert', surface)) return

    try {
      await overlay.alert({
        title: '배포 준비가 완료되었습니다.',
        description: '필수 품질 게이트가 모두 통과했습니다.',
        actionLabel: '확인',
        playground: { onEvent: recordEvent, surface },
      })
      setResult({ demo: 'alert', status: 'fulfilled', value: 'void' })
    } catch {
      finishRun()
    }
  }

  async function showConfirm() {
    const surface = 'confirm · topmost'
    if (!beginRun('confirm', surface)) return
    try {
      const confirmed = await overlay.confirm({
        title: '프로젝트를 삭제할까요?',
        description: '이 데모에서는 실제 데이터가 삭제되지 않습니다.',
        confirmLabel: '삭제',
        cancelLabel: '취소',
        tone: 'danger',
        playground: { onEvent: recordEvent, surface },
      })
      setResult({
        demo: 'confirm',
        status: confirmed ? 'confirmed' : 'dismissed',
        value: confirmed ? 'true' : `false · ${lastCloseReason.current || 'dismissed'}`,
      })
    } catch {
      finishRun()
    }
  }

  async function showAsyncConfirm() {
    const surface = 'async confirm · topmost'
    if (!beginRun('async-confirm', surface)) return
    asyncAttempts.current = 0

    try {
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
        playground: { onEvent: recordEvent, surface },
      })
      setResult({
        demo: 'async-confirm',
        status: confirmed ? 'confirmed' : 'dismissed',
        value: confirmed
          ? `${asyncAttempts.current}번째 시도 · true`
          : `false · ${lastCloseReason.current || 'dismissed'}`,
      })
    } catch {
      finishRun()
    }
  }

  async function showDialog() {
    const surface = 'custom dialog · topmost'
    if (!beginRun('custom', surface)) return

    try {
      const outcome = await overlay.open<PlaygroundDialogResult>(
        <PlaygroundDialog
          instrumentation={{ onEvent: recordEvent, surface }}
          projectId="lyrd-docs"
        />,
      )
      setResult({
        demo: 'custom',
        status: outcome.status,
        value:
          outcome.status === 'resolved'
            ? JSON.stringify(outcome.value)
            : `reason: ${outcome.reason}`,
      })
    } catch {
      finishRun()
    }
  }

  async function showNestedDialog() {
    const surface = 'parent dialog · stack 1'
    if (!beginRun('nested', surface)) return

    try {
      const outcome = await overlay.open<PlaygroundDialogResult>(
        <PlaygroundNestedDialog
          instrumentation={{ onEvent: recordEvent, surface }}
          projectId="lyrd-docs"
        />,
      )
      setResult({
        demo: 'nested',
        status: outcome.status,
        value:
          outcome.status === 'resolved'
            ? JSON.stringify(outcome.value)
            : `reason: ${outcome.reason}`,
      })
    } catch {
      finishRun()
    }
  }

  function runSelectedDemo() {
    if (activeDemo === 'alert') void showAlert()
    if (activeDemo === 'confirm') void showConfirm()
    if (activeDemo === 'async-confirm') void showAsyncConfirm()
    if (activeDemo === 'custom') void showDialog()
    if (activeDemo === 'nested') void showNestedDialog()
  }

  function resetPlayground() {
    if (runningRef.current) return
    asyncAttempts.current = 0
    nextEventId.current = 0
    lastCloseReason.current = ''
    setEvents([])
    setResult(null)
  }

  return (
    <main className="playground-page" id="main-content">
      <header className="playground-hero section-shell">
        <div>
          <p className="playground-kicker">PLAYGROUND / PUBLIC CONTRACTS</p>
          <h1>코드와 lifecycle을 함께 실행하세요.</h1>
        </div>
        <p className="playground-description">
          데모를 고르면 실제 호출 코드가 나타납니다. 실행 후 Promise 결과와 공개 lifecycle을 나란히
          비교해 보세요.
        </p>
      </header>

      <div className="playground-learning section-shell">
        <PlaygroundDemoPicker activeDemo={activeDemo} disabled={running} onSelect={setActiveDemo} />
        <PlaygroundLesson demo={selectedDemo} disabled={running} onRun={runSelectedDemo} />
      </div>

      <section aria-label="실행 결과" className="playground-output section-shell">
        <PlaygroundResultPanel result={result} />
        <PlaygroundEventLog events={events} />
      </section>

      <div className="playground-reset section-shell">
        <div>
          <strong className="playground-reset-title">
            {running ? 'Overlay interaction 진행 중' : '다음 실행 준비 완료'}
          </strong>
          <p>
            실행 중에는 중복 요청을 막습니다. Overlay를 완료하거나 닫은 뒤 결과와 log를 초기화할 수
            있습니다.
          </p>
        </div>
        <button disabled={running} onClick={resetPlayground} type="button">
          결과와 event log 초기화
        </button>
      </div>

      <nav aria-label="Playground 관련 문서" className="playground-links section-shell">
        <Link to="/getting-started">직접 연결해 보기 →</Link>
        <Link to="/api/application">Application API 이해하기 →</Link>
        <Link to="/api/renderer">Renderer API 이해하기 →</Link>
      </nav>
    </main>
  )
}
