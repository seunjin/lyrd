import type { ReactNode } from 'react'

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
  return (
    <article className="doc-page">
      <header className="doc-page-header">
        <div className="doc-page-labels">
          <span>{eyebrow}</span>
          {boundary ? <span data-boundary={boundary}>{boundary} boundary</span> : null}
        </div>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      <div className="doc-content">{children}</div>
    </article>
  )
}

export function CodeBlock({ children, label }: { children: string; label?: string }) {
  return (
    <div className="doc-code-block">
      {label ? <div className="doc-code-label">{label}</div> : null}
      <pre>
        <code>{children}</code>
      </pre>
    </div>
  )
}

export function Callout({ children, title }: { children: ReactNode; title: string }) {
  return (
    <aside className="doc-callout">
      <strong>{title}</strong>
      <div>{children}</div>
    </aside>
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
        <h2>{name}</h2>
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
