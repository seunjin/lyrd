import { Link } from 'react-router-dom'

import { Callout, CodeBlock, DocPage } from '../components/doc-page'

export function IntroductionPage() {
  return (
    <DocPage
      description="Lyrd는 Dialog를 대신 그리지 않습니다. 앱이 소유한 UI와 제품 코드 사이에서 요청, 결과, 정책과 scheduling을 관리합니다."
      eyebrow="INTRODUCTION"
      title="오버레이를 제품의 의도로 다루기"
    >
      <section id="why-lyrd">
        <h2>왜 Lyrd인가</h2>
        <p>
          확인창이 화면마다 다르게 동작하고, 비동기 상태와 중복 요청을 호출부가 반복해서 처리하기
          시작하면 문제는 UI가 아니라 제품 정책이 됩니다. Lyrd는 이런 흐름을
          <code>alert</code>, <code>confirm</code>, typed overlay 같은 의미 단위로 모읍니다.
        </p>
        <Callout title="핵심 원칙">
          Base UI나 Radix는 접근성 primitive를 담당하고, Lyrd는 제품이 사용할 의미와 규칙을
          관리합니다.
        </Callout>
      </section>

      <section id="ownership">
        <h2>역할과 소유권</h2>
        <div className="concept-grid">
          <article>
            <span>LYRD CORE</span>
            <h3>의도와 정책</h3>
            <p>Promise 결과, 중앙 queue, identity, dismiss policy와 세션 수명주기를 관리합니다.</p>
          </article>
          <article>
            <span>YOUR APP</span>
            <h3>표현과 브랜드</h3>
            <p>JSX, 스타일, 문구, 모달 형태와 오류 표현은 애플리케이션 코드에 남습니다.</p>
          </article>
          <article>
            <span>UI PRIMITIVE</span>
            <h3>상호작용 기반</h3>
            <p>포커스, 키보드, portal과 접근 가능한 Dialog 동작은 선택한 primitive가 맡습니다.</p>
          </article>
        </div>
      </section>

      <section id="mental-model">
        <h2>기본 모델</h2>
        <CodeBlock label="APPLICATION">
          {`const confirmed = await overlay.confirm({
  title: '프로젝트를 삭제할까요?',
  confirmLabel: '삭제',
  cancelLabel: '취소',
  tone: 'danger',
})`}
        </CodeBlock>
        <p>
          제품 코드는 결과를 기다립니다. Renderer는 <code>session.resolve()</code>,{' '}
          <code>session.dismiss()</code>, <code>session.requestDismiss()</code>,{' '}
          <code>session.completeExit()</code>을 UI primitive에 연결합니다. 두 역할은 서로 다른
          문서에서 설명합니다.
        </p>
        <div className="doc-actions">
          <Link to="/getting-started">설치부터 시작하기 →</Link>
          <Link to="/api/application">Application API 보기 →</Link>
        </div>
      </section>
    </DocPage>
  )
}
