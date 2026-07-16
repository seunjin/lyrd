import { Outlet, useLocation } from 'react-router-dom'

import { findDocsRoute } from '../docs-manifest'
import { DocsSidebar } from '../navigation/docs-navigation'
import {
  MobilePageTableOfContents,
  PagePagination,
  PageTableOfContents,
} from '../navigation/page-navigation'

export function DocsLayout() {
  const location = useLocation()
  const route = findDocsRoute(location.pathname)

  return (
    <div className="docs-shell">
      <DocsSidebar />
      <main className="docs-main" id="main-content">
        <nav className="docs-breadcrumb" aria-label="현재 위치">
          <span>Docs</span>
          <span aria-hidden>/</span>
          <strong>{route?.title}</strong>
        </nav>
        <MobilePageTableOfContents />
        <Outlet />
        <PagePagination />
      </main>
      <PageTableOfContents />
    </div>
  )
}
