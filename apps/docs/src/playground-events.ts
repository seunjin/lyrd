import type { ConfirmActionStatus, OverlayCloseReason, OverlayPhase } from '@lyrd/core'

export type PlaygroundDemoId = 'alert' | 'confirm' | 'async-confirm' | 'custom' | 'nested'

export type PlaygroundEventState =
  | OverlayPhase
  | Exclude<ConfirmActionStatus, 'idle'>
  | 'close-reason'
  | 'removed'

export type PlaygroundEventInput = {
  detail?: OverlayCloseReason | string
  state: PlaygroundEventState
  surface: string
}

export type PlaygroundEvent = PlaygroundEventInput & {
  id: number
}

export type PlaygroundInstrumentation = {
  onEvent(event: PlaygroundEventInput): void
  surface: string
}

export function emitPlaygroundEvent(
  instrumentation: PlaygroundInstrumentation | undefined,
  state: PlaygroundEventState,
  detail?: PlaygroundEventInput['detail'],
) {
  if (!instrumentation) return

  instrumentation.onEvent(
    detail === undefined
      ? { state, surface: instrumentation.surface }
      : { detail, state, surface: instrumentation.surface },
  )
}
