import { useEffect } from 'react'
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router-dom'
import { DocsSearch } from '../components/docs-search'
import { findDocsRoute } from '../docs-manifest'
import { MobileNavigation } from '../navigation/docs-navigation'

export function SiteLayout() {
  const location = useLocation()
  const docsRoute = findDocsRoute(location.pathname)
  const isDocsPage = Boolean(docsRoute)

  useEffect(() => {
    const pageTitle =
      docsRoute?.title ??
      (location.pathname === '/playground' ? 'Playground' : 'Overlay intent system')
    document.title = `${pageTitle} — Lyrd`
  }, [docsRoute, location.pathname])

  return (
    <>
      <a className="skip-link" href="#main-content">
        본문으로 건너뛰기
      </a>
      <header className="site-header">
        <div className="site-brand">
          <Link className="wordmark" to="/" aria-label="Lyrd 홈">
            LYRD<span className="wordmark-dot">.</span>
          </Link>
          <span className="site-version" title="문서 기준 npm 안정 버전">
            stable · core v{__LYRD_CORE_VERSION__}
          </span>
        </div>
        <nav aria-label="주요 내비게이션" className="site-primary-nav">
          <Link
            aria-current={isDocsPage ? 'page' : undefined}
            className={isDocsPage ? 'active' : undefined}
            to="/introduction"
          >
            Docs
          </Link>
          <NavLink to="/playground">Playground</NavLink>
        </nav>
        <div className="site-header-actions">
          <DocsSearch />
          <a className="header-link" href="https://github.com/seunjin/lyrd">
            GitHub ↗
          </a>
          <MobileNavigation />
        </div>
      </header>
      <Outlet />
      <footer className="site-footer section-shell">
        <div>
          <Link className="wordmark" to="/">
            LYRD<span className="wordmark-dot">.</span>
          </Link>
          <p>Overlay intent system for React products.</p>
        </div>
        <div>
          <Link to="/introduction">Docs</Link>
          <a href={`${import.meta.env.BASE_URL}llms.txt`}>LLM guide</a>
          <a href="https://github.com/seunjin/lyrd">GitHub ↗</a>
          <span>
            Documentation · core v{__LYRD_CORE_VERSION__} · CLI v{__LYRD_CLI_VERSION__}
          </span>
          <span>MIT License · 2026</span>
        </div>
      </footer>
      <ScrollRestoration />
    </>
  )
}
