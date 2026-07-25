import { playgroundDemos } from '../playground-data'
import type { PlaygroundDemoId } from '../playground-events'

export function PlaygroundDemoPicker({
  activeDemo,
  disabled,
  onSelect,
}: {
  activeDemo: PlaygroundDemoId
  disabled: boolean
  onSelect(id: PlaygroundDemoId): void
}) {
  return (
    <fieldset className="playground-controls">
      <legend className="sr-only">데모 선택</legend>
      {playgroundDemos.map((demo) => (
        <button
          aria-pressed={activeDemo === demo.id}
          data-active={activeDemo === demo.id || undefined}
          disabled={disabled}
          key={demo.id}
          onClick={() => onSelect(demo.id)}
          type="button"
        >
          <span>{demo.index}</span>
          <b>{demo.title}</b>
          <small>{demo.description}</small>
          <i aria-hidden>→</i>
        </button>
      ))}
    </fieldset>
  )
}
