import type { ComponentType, ReactElement, ReactNode } from 'react'

declare const overlayDefinitionType: unique symbol
declare const overlayGroupType: unique symbol

export type AlertRequest = {
  title: ReactNode
  description?: ReactNode
  acknowledgeLabel?: ReactNode
  dedupeKey?: string
}

export type ConfirmTone = 'neutral' | 'danger'

export type ConfirmRequest = {
  title: ReactNode
  description?: ReactNode
  confirmLabel: ReactNode
  cancelLabel?: ReactNode
  tone?: ConfirmTone
  /** ESC, outside click 같은 외부 dismiss 요청을 허용할지 결정한다. */
  dismissPolicy?: 'allow' | 'block'
  dedupeKey?: string
  onConfirm?: () => void | Promise<void>
}

export type ConfirmStatus = 'idle' | 'mounting' | 'open' | 'pending' | 'error' | 'closing'

export type AlertStatus = 'idle' | 'mounting' | 'open' | 'closing'

export type DialogStatus = 'idle' | 'mounting' | 'open' | 'closing'

export type DialogOptions = {
  /** ESC, outside click 같은 외부 dismiss 요청을 허용할지 결정한다. */
  dismissPolicy?: 'allow' | 'block'
}

export type OverlayGroupStrategy = 'parallel'

export type OverlayGroup = {
  /** 이 실행 공간에 속한 세션을 스케줄링하는 방식. */
  readonly strategy: OverlayGroupStrategy
  readonly [overlayGroupType]: true
}

export type OverlayGroupOptions = {
  strategy: OverlayGroupStrategy
}

export type OverlayOpenOptions = DialogOptions & {
  group?: OverlayGroup
}

export type OverlayDismissReason = 'cancel' | 'escape' | 'outside' | 'route-change' | 'programmatic'

export type OverlayOutcome<Result> =
  | { status: 'resolved'; value: Result }
  | { status: 'dismissed'; reason: OverlayDismissReason }

/**
 * `await`하면 최종 outcome을 반환하고, 보관하면 해당 활성 세션을 직접 제어할 수 있다.
 * 종료된 세션의 `update`와 `dismiss`는 `false`를 반환한다.
 */
export type OverlayHandle<Input, Result> = Promise<OverlayOutcome<Result>> & {
  update: (input: Input) => boolean
  dismiss: (reason?: OverlayDismissReason) => boolean
}

export type OverlaySession<Result> = {
  open: boolean
  status: Exclude<DialogStatus, 'idle'>
  resolve: (result: Result) => void
  dismiss: (reason: OverlayDismissReason) => void
  /** UI primitive에서 발생한 dismiss 시도를 현재 dismissPolicy에 따라 처리한다. */
  requestDismiss: (reason: OverlayDismissReason) => void
  /** closing 이후 exit lifecycle이 끝났음을 런타임에 알려 세션 제거를 완료한다. */
  completeExit: () => void
}

export type OverlayDefinitionComponentProps<Input, Result> = {
  input: Input
  session: OverlaySession<Result>
}

export type OverlayDefinition<Input, Result> = {
  readonly component: ComponentType<OverlayDefinitionComponentProps<Input, Result>>
  readonly [overlayDefinitionType]?: {
    input: Input
    result: Result
  }
}

export type AlertSnapshot = {
  open: boolean
  request: AlertRequest | null
  status: AlertStatus
}

export type ConfirmSnapshot = {
  open: boolean
  request: ConfirmRequest | null
  status: ConfirmStatus
  error: unknown | null
}

export type DialogSnapshot = {
  open: boolean
  request: null
  element: ReactElement | null
  options: DialogOptions | null
  status: DialogStatus
}

export type ConfirmSurfaceProps = ConfirmSnapshot & {
  confirm: () => void
  cancel: () => void
  requestDismiss: () => void
  completeExit: () => void
}

export type AlertSurfaceProps = AlertSnapshot & {
  acknowledge: () => void
  requestDismiss: () => void
  completeExit: () => void
}

export type OverlayRenderers = {
  alert: ComponentType<AlertSurfaceProps>
  confirm: ComponentType<ConfirmSurfaceProps>
}

export type OverlayDialogApi<Result> = {
  open: boolean
  status: Exclude<DialogStatus, 'idle'>
  resolve: (result: Result) => void
  dismiss: () => void
  requestDismiss: () => void
  completeExit: () => void
}

export type OverlayApi = {
  alert: (request: AlertRequest) => Promise<void>
  confirm: (request: ConfirmRequest) => Promise<boolean>
  dialog: <Result>(element: ReactElement, options?: DialogOptions) => Promise<Result | undefined>
  open: <Input, Result>(
    definition: OverlayDefinition<Input, Result>,
    input: Input,
    options?: OverlayOpenOptions,
  ) => OverlayHandle<Input, Result>
  openOrUpdate: <Input, Result>(
    definition: OverlayDefinition<Input, Result>,
    identity: string,
    input: Input,
    options?: OverlayOpenOptions,
  ) => OverlayHandle<Input, Result>
  dismissAll: (reason?: 'route-change' | 'programmatic') => void
}
