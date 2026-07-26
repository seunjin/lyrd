import { useEffect, useState } from 'react'

import type { DocsTableOfContentsItem } from '../docs-manifest'

export function useActiveTableOfContents(items: DocsTableOfContentsItem[]) {
  const [activeId, setActiveId] = useState<string | undefined>(items[0]?.id)

  useEffect(() => {
    let frame = 0

    function updateActiveId() {
      frame = 0

      const sections = items
        .map((item) => ({ element: document.getElementById(item.id), id: item.id }))
        .filter(
          (section): section is { element: HTMLElement; id: string } => section.element !== null,
        )

      if (sections.length === 0) return

      const headerHeight = Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--header-height'),
      )
      const activationLine = (Number.isNaN(headerHeight) ? 72 : headerHeight) + 48
      const atPageEnd =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2
      const passedSections = sections.filter(
        ({ element }) => element.getBoundingClientRect().top <= activationLine,
      )
      const nextId = atPageEnd
        ? sections.at(-1)?.id
        : (passedSections.at(-1)?.id ?? sections[0]?.id)

      setActiveId((currentId) => (currentId === nextId ? currentId : nextId))
    }

    function scheduleUpdate() {
      if (frame !== 0) return
      frame = window.requestAnimationFrame(updateActiveId)
    }

    scheduleUpdate()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    window.addEventListener('hashchange', scheduleUpdate)

    const content = document.querySelector('.docs-main')
    const contentObserver = content ? new MutationObserver(scheduleUpdate) : null
    if (content) contentObserver?.observe(content, { childList: true, subtree: true })

    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      window.removeEventListener('hashchange', scheduleUpdate)
      contentObserver?.disconnect()
    }
  }, [items])

  return { activeId, setActiveId }
}
