import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="not-found section-shell" id="main-content">
      <p>404 / NOT FOUND</p>
      <h1>이 문서를 찾지 못했습니다.</h1>
      <p>주소가 바뀌었거나 아직 작성되지 않은 문서일 수 있습니다.</p>
      <div>
        <Link className="button button-primary" to="/introduction">
          문서 처음으로
        </Link>
        <Link className="button button-ghost" to="/">
          홈으로
        </Link>
      </div>
    </main>
  )
}
