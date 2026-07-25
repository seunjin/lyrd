import type { ComponentType, ReactElement, ReactNode } from 'react'

export type OverlayRequestMap = {
  alert: object
  confirm: object
}

export type AlertBehavior = {
  onAction?: () => void
}

export type ConfirmBehavior = {
  onConfirm?: () => void | Promise<void>
  closeOnEscape?: boolean
  closeOnOutsidePress?: boolean
}

export type AlertRequest<Fields extends object> = Fields extends unknown
  ? Omit<Fields, keyof AlertBehavior> & AlertBehavior
  : never

export type ConfirmRequest<Fields extends object> = Fields extends unknown
  ? Omit<Fields, keyof ConfirmBehavior> & ConfirmBehavior
  : never

export type OverlayCloseReason = 'cancel' | 'escape' | 'outside' | 'route-change' | 'programmatic'

export type OverlayCloseRequestReason = 'escape' | 'outside'

export type OverlayOutcome<Result> =
  | { status: 'resolved'; value: Result }
  | { status: 'closed'; reason: OverlayCloseReason }

export type OverlayHandle<Value> = Promise<Value> & {
  close(reason?: OverlayCloseReason): boolean
}

export type OpenOptions = {
  closeOnEscape?: boolean
  closeOnOutsidePress?: boolean
}

export type OverlayPhase = 'opening' | 'open' | 'closing'

export type OverlaySession<Result = void> = {
  open: boolean
  phase: OverlayPhase
  resolve(value: Result): boolean
  close(reason?: OverlayCloseReason): boolean
  requestClose(reason: OverlayCloseRequestReason): boolean
  completeClose(): void
}

export type ConfirmActionStatus = 'idle' | 'pending' | 'error'

export type AlertRendererProps<Request extends object> = {
  open: boolean
  phase: OverlayPhase
  request: Request
  action(): void
  completeClose(): void
}

export type ConfirmRendererProps<Request extends object> = {
  open: boolean
  phase: OverlayPhase
  actionStatus: ConfirmActionStatus
  error: unknown | null
  request: Request
  confirm(): void
  cancel(): void
  requestClose(reason: OverlayCloseRequestReason): void
  completeClose(): void
}

export type OverlayRenderers<Requests extends OverlayRequestMap> = {
  alert: ComponentType<AlertRendererProps<Requests['alert']>>
  confirm: ComponentType<ConfirmRendererProps<Requests['confirm']>>
}

export type OverlayClient<Requests extends OverlayRequestMap> = {
  alert(request: AlertRequest<Requests['alert']>): OverlayHandle<void>
  confirm(request: ConfirmRequest<Requests['confirm']>): OverlayHandle<boolean>
  open<Result = void>(
    element: ReactElement,
    options?: OpenOptions,
  ): OverlayHandle<OverlayOutcome<Result>>
  close(reason?: OverlayCloseReason): boolean
  closeAll(reason?: OverlayCloseReason): void
}

export type OverlayScope<Requests extends OverlayRequestMap> = {
  OverlayProvider: ComponentType<{
    children?: ReactNode
    client?: OverlayClient<Requests>
    renderers: OverlayRenderers<Requests>
  }>
  useOverlay(): OverlayClient<Requests>
  createClient(): OverlayClient<Requests>
}

type ReservedFieldConflicts<
  Recipe extends string,
  Fields,
  Behavior extends object,
> = Fields extends unknown
  ? {
      [Field in Extract<keyof Fields, keyof Behavior>]: Field extends string
        ? `${Recipe}.${Field} is reserved by Lyrd`
        : never
    }[Extract<keyof Fields, keyof Behavior>]
  : never

type OverlayRequestConflicts<Requests extends OverlayRequestMap> =
  | ReservedFieldConflicts<'alert', Requests['alert'], AlertBehavior>
  | ReservedFieldConflicts<'confirm', Requests['confirm'], ConfirmBehavior>

/** createOverlayScope 구현이 따라야 하는 compile-time 호출 계약이다. */
export type CreateOverlayScope = <Requests extends OverlayRequestMap>(
  ...conflict: [OverlayRequestConflicts<Requests>] extends [never]
    ? []
    : [error: OverlayRequestConflicts<Requests>]
) => OverlayScope<Requests>
