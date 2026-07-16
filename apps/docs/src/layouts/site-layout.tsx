import { useEffect } from 'react'
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router-dom'

import { findDocsRoute } from '../docs-manifest'
import { MobileNavigation } from '../navigation/docs-navigation'

export function SiteLayout() {
  const location = useLocation()

  useEffect(() => {
    const docsRoute = findDocsRoute(location.pathname)
    const pageTitle =
      docsRoute?.title ??
      (location.pathname === '/playground' ? 'Playground' : 'Overlay intent system')
    document.title = `${pageTitle} — Lyrd`
  }, [location.pathname])

  return (
    <>
      <a className="skip-link" href="#main-content">
        본문으로 건너뛰기
      </a>
      <header className="site-header">
        <Link className="wordmark" to="/" aria-label="Lyrd 홈">
          LYRD<span className="wordmark-dot">.</span>
        </Link>
        <nav aria-label="주요 내비게이션" className="site-primary-nav">
          <NavLink to="/introduction">문서</NavLink>
          <NavLink to="/getting-started">시작하기</NavLink>
          <NavLink to="/playground">Playground</NavLink>
        </nav>
        <div className="site-header-actions">
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
          <span>MIT License · 2026</span>
        </div>
      </footer>
      <ScrollRestoration />
    </>
  )
}
