import { Link, useLocation } from 'react-router-dom'

import { docsRoutes, findDocsRoute } from '../docs-manifest'

export function PageTableOfContents() {
  const location = useLocation()
  const route = findDocsRoute(location.pathname)

  if (!route) return null

  return (
    <aside aria-label="현재 페이지 목차" className="page-toc">
      <strong>이 페이지에서</strong>
      <ul>
        {route.toc.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`}>{item.label}</a>
          </li>
        ))}
      </ul>
    </aside>
  )
}

export function MobilePageTableOfContents() {
  const location = useLocation()
  const route = findDocsRoute(location.pathname)

  if (!route) return null

  return (
    <details className="mobile-page-toc">
      <summary>이 페이지에서</summary>
      <ul>
        {route.toc.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`}>{item.label}</a>
          </li>
        ))}
      </ul>
    </details>
  )
}

export function PagePagination() {
  const location = useLocation()
  const index = docsRoutes.findIndex((route) => route.path === location.pathname.replace(/\/$/, ''))

  if (index < 0) return null

  const previous = docsRoutes[index - 1]
  const next = docsRoutes[index + 1]

  return (
    <nav aria-label="이전 및 다음 문서" className="page-pagination">
      {previous ? (
        <Link rel="prev" to={previous.path}>
          <span>이전</span>
          <strong>{previous.title}</strong>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link rel="next" to={next.path}>
          <span>다음</span>
          <strong>{next.title}</strong>
        </Link>
      ) : null}
    </nav>
  )
}
