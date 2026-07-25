import type { PlaygroundDemoId } from '../playground-events'

export type PlaygroundResult = {
  demo: PlaygroundDemoId
  status: string
  value: string
}

export function PlaygroundResultPanel({ result }: { result: PlaygroundResult | null }) {
  return (
    <section aria-labelledby="playground-result-title" className="playground-result">
      <span>LAST RESULT</span>
      <h2 id="playground-result-title">
        {result ? '완료된 Promise 결과' : '아직 완료된 결과가 없습니다'}
      </h2>
      {result ? (
        <dl aria-live="polite">
          <div>
            <dt>Demo</dt>
            <dd>{result.demo}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{result.status}</dd>
          </div>
          <div>
            <dt>Value</dt>
            <dd>{result.value}</dd>
          </div>
        </dl>
      ) : (
        <p aria-live="polite">데모를 실행하면 여기에서 반환 타입과 값을 확인할 수 있습니다.</p>
      )}
    </section>
  )
}
