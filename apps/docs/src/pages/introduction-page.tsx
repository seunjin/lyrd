import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Callout, CodeBlock, DocPage } from '../components/doc-page'

export function IntroductionPage() {
  return (
    <DocPage
      description="Lyrd는 UI를 대신 그리지 않습니다. 앱이 소유한 modal UI와 제품 코드 사이에서 요청, 결과와 LIFO stack을 관리합니다."
      eyebrow="INTRODUCTION"
      title="오버레이를 제품의 의도로 다루기"
    >
      <section id="why-lyrd">
        <h2>왜 Lyrd인가</h2>
        <p>
          확인창마다 비동기 상태와 닫힘 규칙을 반복하면 제품의 UX가 쉽게 달라집니다. Lyrd는 자주
          쓰는 흐름을 <code>alert()</code>와 <code>confirm()</code>으로 통일하고, 나머지 Dialog,
          Sheet, BottomSheet는 <code>open(&lt;Component /&gt;)</code> 하나로 엽니다.
        </p>
        <Callout title="제한된 Core">
          Core는 화면을 가리는 modal interaction만 다룹니다. Toast와 non-modal notification은 각
          앱의 알림 시스템이 소유합니다.
        </Callout>
      </section>

      <section id="ownership">
        <h2>역할과 소유권</h2>
        <div className="concept-grid">
          <article>
            <span>LYRD CORE</span>
            <h3>의도와 흐름</h3>
            <p>Promise 결과, LIFO stack, topmost 판정과 닫힘 lifecycle을 관리합니다.</p>
          </article>
          <article>
            <span>YOUR APP</span>
            <h3>표현과 요청 타입</h3>
            <p>JSX, 스타일, 문구, Alert·Confirm 필드와 모달 형태를 직접 정의합니다.</p>
          </article>
          <article>
            <span>UI PRIMITIVE</span>
            <h3>접근성 동작</h3>
            <p>포커스, 키보드, portal과 접근 가능한 Dialog 동작을 담당합니다.</p>
          </article>
        </div>
      </section>

      <section id="mental-model">
        <h2>기본 모델</h2>
        <CodeBlock label="APPLICATION">
          {`const confirmed = await overlay.confirm({
  title: '프로젝트를 삭제할까요?',
  tone: 'danger',
  onConfirm: () => deleteProject(),
})

const outcome = await overlay.open<Result>(
  <ProjectEditor projectId={projectId} />,
)`}
        </CodeBlock>
        <p>
          호출부의 <code>onConfirm</code>은 확인 뒤 실행할 작업입니다. Renderer가 받는{' '}
          <code>confirm()</code>은 그 작업과 pending·error·retry를 실행하는 Core action입니다.
          custom overlay는 <code>useOverlaySession()</code>으로 결과와 닫힘을 연결합니다.
        </p>
        <nav aria-label="추천 다음 단계" className="doc-next-steps">
          <span>NEXT STEPS</span>
          <Link to="/getting-started">
            <span>
              <strong>설치부터 시작하기</strong>
              <small>Scope와 Provider를 연결합니다.</small>
            </span>
            <ArrowRight aria-hidden size={19} strokeWidth={2} />
          </Link>
          <Link to="/api/application">
            <span>
              <strong>Application API 보기</strong>
              <small>다섯 개의 공개 메서드를 확인합니다.</small>
            </span>
            <ArrowRight aria-hidden size={19} strokeWidth={2} />
          </Link>
        </nav>
      </section>
    </DocPage>
  )
}
