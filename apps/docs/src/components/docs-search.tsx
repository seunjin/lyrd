import { Dialog } from '@base-ui/react/dialog'
import { ArrowRight, Search, X } from 'lucide-react'
import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { searchDocs } from '../docs-search-index'

export function DocsSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLElement>(null)
  const results = searchDocs(query)
  const hasQuery = query.trim().length > 0

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const target = event.target
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
        return
      }

      if (!typing && !event.metaKey && !event.ctrlKey && !event.altKey && event.key === '/') {
        event.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) setQuery('')
  }

  function handleSearchKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'ArrowDown' || results.length === 0) return
    event.preventDefault()
    resultsRef.current?.querySelector<HTMLAnchorElement>('a')?.focus()
  }

  return (
    <Dialog.Root onOpenChange={handleOpenChange} open={open}>
      <Dialog.Trigger aria-label="문서 검색 열기" className="docs-search-trigger">
        <Search aria-hidden size={17} strokeWidth={2} />
        <span>문서 검색</span>
        <kbd aria-hidden>⌘ K</kbd>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="docs-search-backdrop" />
        <Dialog.Viewport className="docs-search-viewport">
          <Dialog.Popup className="docs-search-popup" initialFocus={inputRef}>
            <div className="docs-search-heading">
              <div>
                <Dialog.Title>문서 검색</Dialog.Title>
                <Dialog.Description>
                  API 이름이나 “Overlay가 안 닫힘” 같은 표현으로 찾아보세요.
                </Dialog.Description>
              </div>
              <Dialog.Close aria-label="문서 검색 닫기" className="docs-search-close">
                <X aria-hidden size={20} strokeWidth={2} />
              </Dialog.Close>
            </div>

            <label className="docs-search-field">
              <Search aria-hidden size={19} strokeWidth={2} />
              <span className="sr-only">검색어</span>
              <input
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="예: confirm, Provider 오류, 안 닫힘"
                ref={inputRef}
                type="search"
                value={query}
              />
            </label>

            <div aria-live="polite" className="docs-search-status">
              {hasQuery
                ? `${results.length}개의 문서를 찾았습니다.`
                : '검색어를 입력하면 제목, 목차와 핵심 API를 함께 찾습니다.'}
            </div>

            {hasQuery && results.length === 0 ? (
              <div className="docs-search-empty">
                <strong>일치하는 문서가 없습니다.</strong>
                <p>API 철자를 확인하거나 “오류”, “닫힘”, “설치”처럼 짧게 검색해 보세요.</p>
                <Link onClick={() => setOpen(false)} to="/troubleshooting">
                  Troubleshooting 확인하기 <ArrowRight aria-hidden size={17} />
                </Link>
              </div>
            ) : null}

            {results.length > 0 ? (
              <nav aria-label="문서 검색 결과" className="docs-search-results" ref={resultsRef}>
                {results.map(({ matchedSection, route }) => (
                  <Link
                    key={route.path}
                    onClick={() => setOpen(false)}
                    to={`${route.path}${matchedSection ? `#${matchedSection.id}` : ''}`}
                  >
                    <span>
                      <strong>{route.title}</strong>
                      <small>{route.description}</small>
                      {matchedSection ? <em>일치한 목차 · {matchedSection.label}</em> : null}
                    </span>
                    <ArrowRight aria-hidden size={18} strokeWidth={2} />
                  </Link>
                ))}
              </nav>
            ) : null}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
