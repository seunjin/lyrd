import { useOverlay } from '@lyrd/core'
import { useRef, useState } from 'react'

import { AppOverlayProvider } from './lyrd/overlay-provider'
import { playgroundDialog } from './playground-dialog'

const confirmCode = `const confirmed = await overlay.confirm({
  title: '프로젝트를 삭제할까요?',
  description: '삭제한 프로젝트는 복구할 수 없습니다.',
  confirmLabel: '삭제',
  cancelLabel: '취소',
  tone: 'danger',
  onConfirm: () => deleteProject(projectId),
})`

const dialogCode = `const outcome = await overlay.open(
  documentEditor,
  { documentId: 'rfc-0003' },
)`

function DocsPage() {
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
    <>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Lyrd 처음으로">
          LYRD<span className="wordmark-dot">.</span>
        </a>
        <nav aria-label="주요 문서">
          <a href="#why">문제</a>
          <a href="#model">구조</a>
          <a href="#playground">데모</a>
          <a href="#start">시작하기</a>
        </nav>
        <a className="header-link" href="https://github.com/seunjin/lyrd">
          GitHub ↗
        </a>
      </header>

      <main id="top">
        <section className="hero section-shell">
          <div className="hero-copy">
            <p className="eyebrow">
              <span>React</span> overlay intent system
            </p>
            <h1>
              오버레이는 UI가 아니라
              <br />
              제품의 <em>의도</em>다.
            </h1>
            <p className="hero-description">
              Base UI, Radix, 커스텀 컴포넌트 중 무엇을 렌더링하든
              <br />
              요청·결과·정책·대기열은 한곳에서 관리합니다.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#start">
                5분 만에 시작하기
              </a>
              <button
                className="button button-ghost"
                onClick={() => void showConfirm()}
                type="button"
              >
                confirm 체험하기 <span>↗</span>
              </button>
            </div>
          </div>

          <div className="hero-system">
            <div className="code-window">
              <div className="window-bar">
                <span />
                <span />
                <span />
                <b>delete-project.tsx</b>
              </div>
              <pre>
                <code>
                  <i>const</i> confirmed = <i>await</i>
                  {'\n'}overlay.<strong>confirm</strong>({'{'}
                  {'\n'} title: <q>프로젝트를 삭제할까요?</q>,{'\n'} tone: <q>danger</q>,{'\n'}
                  {'}'})
                </code>
              </pre>
            </div>
            <div className="system-layers">
              <div>
                <b>01</b>
                <span>Lyrd core</span>
                <small>상태 · 결과 · 정책</small>
              </div>
              <div>
                <b>02</b>
                <span>Local renderer</span>
                <small>JSX · 스타일 · 브랜드</small>
              </div>
              <div>
                <b>03</b>
                <span>Base UI</span>
                <small>접근성 · 포커스 · 포털</small>
              </div>
            </div>
          </div>
        </section>

        <section className="manifesto" id="why">
          <div className="section-shell manifesto-grid">
            <p className="section-index">01 / WHY</p>
            <div>
              <h2>
                Dialog를 하나 더 만드는 것이
                <br />
                문제를 해결하지는 않습니다.
              </h2>
              <p className="manifesto-copy">
                확인창이 화면마다 다르게 동작하고, 비동기 상태와 중복 요청을 호출부가 반복해서
                처리하는 순간 문제는 UI가 아니라 제품 정책이 됩니다.
              </p>
            </div>
            <ul className="problem-list">
              <li>
                <span>×</span> 같은 확인창이 연속으로 두 번 열림
              </li>
              <li>
                <span>×</span> 비동기 처리 중 ESC로 닫힘
              </li>
              <li>
                <span>×</span> 화면마다 달라지는 결과와 오류 처리
              </li>
              <li>
                <span>×</span> Dialog 구현에 섞이는 제품 규칙
              </li>
            </ul>
          </div>
        </section>

        <section className="model section-shell" id="model">
          <div className="section-heading">
            <p className="section-index">02 / OWNERSHIP</p>
            <h2>각자 잘하는 일만 맡습니다.</h2>
            <p className="section-description">
              Lyrd는 프리미티브를 포크하지 않고, 앱의 UI를 패키지 안에 가두지 않습니다.
            </p>
          </div>
          <div className="ownership-grid">
            <article className="ownership-card featured">
              <p className="ownership-kicker">LYRD CORE</p>
              <h3>의도와 정책</h3>
              <ul>
                <li>Promise 결과</li>
                <li>중앙 대기열</li>
                <li>중복 방지</li>
                <li>비동기 상태</li>
              </ul>
              <span className="card-mark">L</span>
            </article>
            <article className="ownership-card">
              <p className="ownership-kicker">YOUR APP</p>
              <h3>표현과 브랜드</h3>
              <ul>
                <li>JSX 구조</li>
                <li>디자인 시스템</li>
                <li>오류 문구</li>
                <li>모달 형태</li>
              </ul>
              <span className="card-mark">Y</span>
            </article>
            <article className="ownership-card dark">
              <p className="ownership-kicker">BASE UI / RADIX</p>
              <h3>프리미티브 동작</h3>
              <ul>
                <li>접근성</li>
                <li>포커스 관리</li>
                <li>포털</li>
                <li>키보드 동작</li>
              </ul>
              <span className="card-mark">B</span>
            </article>
          </div>
        </section>

        <section className="playground" id="playground">
          <div className="section-shell">
            <div className="section-heading playground-heading">
              <div>
                <p className="section-index">03 / PLAYGROUND</p>
                <h2>행동을 직접 확인하세요.</h2>
              </div>
              <p className="section-description playground-description">
                모든 화면은 앱이 소유한 Base UI 로컬 렌더러입니다. Lyrd는 그 뒤의 흐름만 관리합니다.
              </p>
            </div>
            <div className="demo-panel">
              <div className="demo-controls">
                <button onClick={() => void showAlert()} type="button">
                  <span>01</span>
                  <b>Alert</b>
                  <small>내용을 인지하고 닫기</small>
                  <i>→</i>
                </button>
                <button onClick={() => void showConfirm()} type="button">
                  <span>02</span>
                  <b>Confirm</b>
                  <small>취소 또는 진행 결정</small>
                  <i>→</i>
                </button>
                <button onClick={() => void showAsyncConfirm()} type="button">
                  <span>03</span>
                  <b>Async confirm</b>
                  <small>pending · error · retry</small>
                  <i>→</i>
                </button>
                <button onClick={() => void showDialog()} type="button">
                  <span>04</span>
                  <b>Custom dialog</b>
                  <small>임의의 React UI와 결과</small>
                  <i>→</i>
                </button>
              </div>
              <div className="demo-result">
                <span>LAST RESULT</span>
                <p className="demo-result-copy" aria-live="polite">
                  {result}
                </p>
                <div className="queue-line">
                  <i />
                  <span>central overlay queue</span>
                  <i />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="start section-shell" id="start">
          <div className="section-heading start-heading">
            <div>
              <p className="section-index">04 / QUICK START</p>
              <h2>
                UI는 생성하고,
                <br />
                코드는 직접 소유하세요.
              </h2>
            </div>
            <p className="section-description">
              CLI는 Base UI 렌더러를 앱 안에 생성합니다. 기존 파일은 자동으로 덮어쓰지 않습니다.
            </p>
          </div>
          <div className="terminal-card">
            <div className="terminal-title">
              <span>TERMINAL</span>
              <small>01 — install local renderer</small>
            </div>
            <pre>
              <code>
                <i>$</i> pnpm dlx @lyrd/cli add overlay
              </code>
            </pre>
            <div className="file-tree">
              <span>src/lyrd/overlay/</span>
              <b>├─ alert.tsx</b>
              <b>├─ confirm.tsx</b>
              <b>├─ overlay-provider.tsx</b>
              <b>└─ overlay.css</b>
            </div>
          </div>
          <div className="code-examples">
            <article>
              <div>
                <span>CONFIRM</span>
                <small>Promise&lt;boolean&gt;</small>
              </div>
              <pre>
                <code>{confirmCode}</code>
              </pre>
            </article>
            <article>
              <div>
                <span>CUSTOM OVERLAY</span>
                <small>Promise&lt;OverlayOutcome&lt;Result&gt;&gt;</small>
              </div>
              <pre>
                <code>{dialogCode}</code>
              </pre>
            </article>
          </div>
        </section>

        <section className="principles">
          <div className="section-shell principle-grid">
            <p className="section-index">05 / PRINCIPLES</p>
            <blockquote>
              “Base UI는 동작의 기반을 제공하고,
              <br />
              <strong>Lyrd는 제품에서 사용할 의미와 규칙을 관리한다.</strong>”
            </blockquote>
            <div className="principle-tags">
              <span>Renderer agnostic</span>
              <span>App-owned UI</span>
              <span>Promise results</span>
              <span>Queue by default</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer section-shell">
        <div>
          <a className="wordmark" href="#top">
            LYRD<span className="wordmark-dot">.</span>
          </a>
          <p className="footer-description">Overlay intent system for React products.</p>
        </div>
        <div>
          <a href="https://github.com/seunjin/lyrd">GitHub ↗</a>
          <a href="https://github.com/seunjin/lyrd/blob/main/README.md">README ↗</a>
          <span>MIT License · 2026</span>
        </div>
      </footer>
    </>
  )
}

export function App() {
  return (
    <AppOverlayProvider>
      <DocsPage />
    </AppOverlayProvider>
  )
}
