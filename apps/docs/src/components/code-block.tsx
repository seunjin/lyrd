import { Check, Copy, TriangleAlert } from 'lucide-react'
import { useState } from 'react'

type CopyStatus = 'idle' | 'copied' | 'error'

export function CodeBlock({ children, label = 'CODE' }: { children: string; label?: string }) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(children)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    }
  }

  const copyLabel =
    copyStatus === 'copied' ? '복사됨' : copyStatus === 'error' ? '다시 시도' : '복사'

  return (
    <div className="doc-code-block">
      <div className="doc-code-toolbar">
        <span className="doc-code-label">{label}</span>
        <button
          aria-label={`${label} 코드 ${copyLabel}`}
          className="doc-code-copy"
          onClick={copyCode}
          type="button"
        >
          {copyStatus === 'copied' ? (
            <Check aria-hidden size={14} strokeWidth={2} />
          ) : copyStatus === 'error' ? (
            <TriangleAlert aria-hidden size={14} strokeWidth={2} />
          ) : (
            <Copy aria-hidden size={14} strokeWidth={2} />
          )}
          <span aria-live="polite">{copyLabel}</span>
        </button>
      </div>
      <pre>
        <code>{children}</code>
      </pre>
    </div>
  )
}
