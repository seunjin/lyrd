import type { ReactNode } from 'react'

type CalloutTone = 'note' | 'warning' | 'danger'

export function Callout({
  children,
  title,
  tone = 'note',
}: {
  children: ReactNode
  title: string
  tone?: CalloutTone
}) {
  return (
    <aside className="doc-callout" data-tone={tone}>
      <strong>{title}</strong>
      <div>{children}</div>
    </aside>
  )
}
