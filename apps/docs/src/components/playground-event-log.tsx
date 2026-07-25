import type { PlaygroundEvent } from '../playground-events'

export function PlaygroundEventLog({ events }: { events: readonly PlaygroundEvent[] }) {
  return (
    <section aria-labelledby="playground-events-title" className="playground-events">
      <div className="playground-panel-heading">
        <div>
          <span>PUBLIC LIFECYCLE</span>
          <h2 id="playground-events-title">Event log</h2>
        </div>
        <p>아래에서 위가 아니라, 위에서 아래 순서로 진행됩니다.</p>
      </div>
      {events.length ? (
        <ol aria-live="polite">
          {events.map((event, index) => (
            <li data-state={event.state} key={event.id}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{event.state}</strong>
              <p>{event.surface}</p>
              {event.detail ? <code>{event.detail}</code> : null}
            </li>
          ))}
        </ol>
      ) : (
        <p className="playground-empty-events">
          실행하면 opening·open·pending·error·closing·removed와 close reason이 기록됩니다.
        </p>
      )}
    </section>
  )
}
