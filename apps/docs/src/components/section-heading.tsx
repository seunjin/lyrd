import { Link as LinkIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function SectionHeading({ children, id }: { children: ReactNode; id: string }) {
  return (
    <h2 className="doc-section-heading">
      <a href={`#${id}`}>
        <span>{children}</span>
        <LinkIcon aria-hidden className="doc-section-heading-icon" size={18} strokeWidth={2} />
      </a>
    </h2>
  )
}
