import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export type RelatedDoc = {
  description: string
  path: string
  title: string
}

export function RelatedDocs({
  items,
  title = '관련 문서',
}: {
  items: RelatedDoc[]
  title?: string
}) {
  return (
    <nav aria-label={title} className="doc-related-links">
      <span>{title}</span>
      {items.map((item) => (
        <Link key={item.path} to={item.path}>
          <span>
            <strong>{item.title}</strong>
            <small>{item.description}</small>
          </span>
          <ArrowRight aria-hidden size={19} strokeWidth={2} />
        </Link>
      ))}
    </nav>
  )
}
