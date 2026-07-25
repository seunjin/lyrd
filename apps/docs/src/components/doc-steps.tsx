import type { ReactNode } from 'react'

export type DocStepItem = {
  description: ReactNode
  id: string
  title: ReactNode
}

export function DocSteps({ items }: { items: DocStepItem[] }) {
  return (
    <ol className="doc-steps">
      {items.map((item, index) => (
        <li key={item.id}>
          <span aria-hidden className="doc-step-number">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div>
            <strong>{item.title}</strong>
            <div>{item.description}</div>
          </div>
        </li>
      ))}
    </ol>
  )
}
