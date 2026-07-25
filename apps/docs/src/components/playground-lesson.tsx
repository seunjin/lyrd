import { Link } from 'react-router-dom'

import type { PlaygroundDemo } from '../playground-data'
import { CodeBlock } from './code-block'

export function PlaygroundLesson({
  demo,
  disabled,
  onRun,
}: {
  demo: PlaygroundDemo
  disabled: boolean
  onRun(): void
}) {
  return (
    <section aria-labelledby="playground-lesson-title" className="playground-lesson">
      <div className="playground-lesson-header">
        <div>
          <span>SELECTED RECIPE</span>
          <h2 id="playground-lesson-title">{demo.title}</h2>
          <p>{demo.description}</p>
        </div>
        <button aria-disabled={disabled} onClick={onRun} type="button">
          {disabled ? '실행 중…' : '이 데모 실행'}
        </button>
      </div>
      <CodeBlock label={`${demo.title} 호출 코드`}>{demo.code}</CodeBlock>
      <Link className="playground-lesson-link" to={demo.docPath}>
        {demo.docLabel}에서 전체 계약 보기 →
      </Link>
    </section>
  )
}
