import { useOverlay } from '@lyrd/core'
import { X } from 'lucide-react'
import { Link } from 'react-router-dom'

const confirmCode = `const confirmed = await overlay.confirm({
  title: '프로젝트를 삭제할까요?',
  confirmLabel: '삭제',
  cancelLabel: '취소',
  tone: 'danger',
})`

const dialogCode = `const outcome = await overlay.open(
  documentEditor,
  { documentId: 'rfc-0003' },
)`

export function HomePage() {
  const overlay = useOverlay()

  async function showConfirm() {
    await overlay.confirm({
      title: '문서 구조를 직접 살펴볼까요?',
      description: '이 데모는 문서 앱이 직접 소유한 renderer를 사용합니다.',
      confirmLabel: 'Playground 보기',
      cancelLabel: '계속 둘러보기',
    })
  }

  return (
    <main id="main-content">
      <section className="hero section-shell">
        <div className="hero-copy">
          <p className="eyebrow">
            <span>LYRD</span> layered overlay intent
          </p>
          <h1>
            <span>의도와 표현을,</span>
            <span>
              <em>레이어로</em> 나눕니다.
            </span>
          </h1>
          <p className="hero-description">
            Lyrd는 오버레이의 요청·결과·정책·대기열을 조율합니다. 렌더러와 UI 선택권은 앱에 그대로
            남습니다.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/getting-started">
              5분 만에 시작하기
            </Link>
            <Link className="button button-ghost" to="/introduction">
              문서 둘러보기 <span aria-hidden>↗</span>
            </Link>
          </div>
        </div>

        <div className="hero-system">
          <div className="layered-wordmark">
            <span>LYRD</span>
            <strong>LAYERED</strong>
          </div>
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
          <ol className="system-layers" aria-label="Lyrd의 세 레이어">
            <li>
              <b>01</b>
              <span>Intent orchestration</span>
              <small>요청 · 결과 · 정책</small>
            </li>
            <li>
              <b>02</b>
              <span>App renderer</span>
              <small>JSX · 스타일 · 브랜드</small>
            </li>
            <li>
              <b>03</b>
              <span>UI primitive</span>
              <small>접근성 · 포커스 · 포털</small>
            </li>
          </ol>
        </div>
      </section>

      <section className="manifesto">
        <div className="section-shell manifesto-grid">
          <p className="section-index">01 / WHY</p>
          <div className="manifesto-copy-block">
            <h2>
              <span>Dialog를 하나 더 만드는 것이</span>
              <span>문제를 해결하지는 않습니다.</span>
            </h2>
            <p className="manifesto-copy">
              확인창이 화면마다 다르게 동작하고 비동기 상태와 중복 요청을 호출부가 반복해서 처리하는
              순간, 문제는 UI가 아니라 제품 정책이 됩니다.
            </p>
          </div>
          <ul className="problem-list">
            <li>
              <span className="problem-icon" aria-hidden="true">
                <X size={16} strokeWidth={2.5} />
              </span>
              <span>같은 확인창이 연속으로 두 번 열림</span>
            </li>
            <li>
              <span className="problem-icon" aria-hidden="true">
                <X size={16} strokeWidth={2.5} />
              </span>
              <span>비동기 처리 중 ESC로 닫힘</span>
            </li>
            <li>
              <span className="problem-icon" aria-hidden="true">
                <X size={16} strokeWidth={2.5} />
              </span>
              <span>화면마다 달라지는 결과와 오류 처리</span>
            </li>
            <li>
              <span className="problem-icon" aria-hidden="true">
                <X size={16} strokeWidth={2.5} />
              </span>
              <span>Dialog 구현에 섞이는 제품 규칙</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="model section-shell">
        <div className="section-heading">
          <p className="section-index">02 / OWNERSHIP</p>
          <h2>각자 잘하는 일만 맡습니다.</h2>
          <p className="section-description">
            Lyrd는 primitive를 포크하지 않고, 앱의 UI를 패키지 안에 가두지 않습니다.
          </p>
        </div>
        <div className="ownership-grid">
          <article className="ownership-card featured">
            <p>LYRD CORE</p>
            <h3>의도와 정책</h3>
            <ul>
              <li>Promise 결과</li>
              <li>중앙 대기열</li>
              <li>identity와 Handle</li>
              <li>dismiss policy</li>
            </ul>
            <span className="card-mark">L</span>
          </article>
          <article className="ownership-card">
            <p>YOUR APP</p>
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
            <p>UI PRIMITIVE</p>
            <h3>접근성 동작</h3>
            <ul>
              <li>접근성</li>
              <li>포커스 관리</li>
              <li>Portal</li>
              <li>키보드 동작</li>
            </ul>
            <span className="card-mark">P</span>
          </article>
        </div>
      </section>

      <section className="home-routes">
        <div className="section-shell">
          <div className="section-heading">
            <p className="section-index">03 / EXPLORE</p>
            <h2>필요한 역할부터 찾아가세요.</h2>
            <p className="section-description">
              개념, API reference와 실제 recipe를 한 화면에 섞지 않고 독립된 경로로 나눴습니다.
            </p>
          </div>
          <div className="home-route-grid">
            <Link to="/getting-started">
              <span>01</span>
              <strong>Getting Started</strong>
              <p>설치, 로컬 renderer, Provider와 첫 호출</p>
              <i aria-hidden>→</i>
            </Link>
            <Link to="/api/application">
              <span>02</span>
              <strong>Application API</strong>
              <p>열기, 갱신, 기다리기와 전체 종료</p>
              <i aria-hidden>→</i>
            </Link>
            <Link to="/api/renderer">
              <span>03</span>
              <strong>Renderer API</strong>
              <p>앱 소유 UI와 lifecycle 연결</p>
              <i aria-hidden>→</i>
            </Link>
            <Link to="/playground">
              <span>04</span>
              <strong>Playground</strong>
              <p>실제 alert, confirm과 custom overlay</p>
              <i aria-hidden>→</i>
            </Link>
          </div>
          <button className="home-demo-button" onClick={() => void showConfirm()} type="button">
            앱 소유 confirm 체험하기 <span aria-hidden>↗</span>
          </button>
        </div>
      </section>

      <section className="start section-shell">
        <div className="section-heading start-heading">
          <p className="section-index">04 / QUICK START</p>
          <h2>
            UI는 생성하고,
            <br />
            코드는 직접 소유하세요.
          </h2>
          <p className="section-description">
            CLI는 renderer 코드를 앱 안에 생성합니다. 기존 파일은 자동으로 덮어쓰지 않습니다.
          </p>
        </div>
        <div className="terminal-card">
          <div>
            <span>TERMINAL</span>
            <small>01 — install local renderer</small>
          </div>
          <pre>
            <code>
              <i>$</i> pnpm dlx @lyrd/cli@next add overlay
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
              <small>OverlayHandle&lt;Input, Result&gt;</small>
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
            <span>“표현은 앱이 소유하고,</span>
            <strong>Lyrd는 오버레이의 의도와 흐름을 조율합니다.”</strong>
          </blockquote>
          <div className="principle-tags">
            <span>Renderer agnostic</span>
            <span>App-owned UI</span>
            <span>Awaitable handles</span>
            <span>Queue by default</span>
          </div>
        </div>
      </section>
    </main>
  )
}
