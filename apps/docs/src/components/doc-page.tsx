import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

import { findDocsRoute } from '../docs-manifest'
import { CodeBlock } from './code-block'
import { SectionHeading } from './section-heading'

export function DocPage({
  boundary,
  children,
  description,
  eyebrow,
  title,
}: {
  boundary?: 'application' | 'renderer'
  children: ReactNode
  description: string
  eyebrow: string
  title: string
}) {
  const location = useLocation()
  const route = findDocsRoute(location.pathname)
  const editUrl = route
    ? `https://github.com/seunjin/lyrd/edit/main/${route.sourcePath}`
    : 'https://github.com/seunjin/lyrd/tree/main/apps/docs/src/pages'

  return (
    <article className="doc-page">
      <header className="doc-page-header">
        <div className="doc-page-labels">
          <span>{eyebrow}</span>
          {boundary ? <span data-boundary={boundary}>{boundary} boundary</span> : null}
        </div>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="doc-page-meta">
          <span>
            문서 기준 · @lyrd/core v{__LYRD_CORE_VERSION__} · @lyrd/cli v{__LYRD_CLI_VERSION__} ·
            npm latest
          </span>
          <a href={editUrl}>GitHub에서 이 페이지 수정 ↗</a>
        </div>
      </header>
      <div className="doc-content">{children}</div>
    </article>
  )
}

export function ApiEntry({
  children,
  id,
  name,
  purpose,
  returns,
  signature,
}: {
  children: ReactNode
  id: string
  name: string
  purpose: string
  returns: ReactNode
  signature: string
}) {
  return (
    <section className="api-entry" id={id}>
      <div className="api-entry-heading">
        <SectionHeading id={id}>{name}</SectionHeading>
        <span>{purpose}</span>
      </div>
      <CodeBlock label="SIGNATURE">{signature}</CodeBlock>
      <dl className="api-summary">
        <div>
          <dt>역할</dt>
          <dd>{purpose}</dd>
        </div>
        <div>
          <dt>반환</dt>
          <dd>{returns}</dd>
        </div>
      </dl>
      {children}
    </section>
  )
}

export function ContractList({ children }: { children: ReactNode }) {
  return <ul className="contract-list">{children}</ul>
}
