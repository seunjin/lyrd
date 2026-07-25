import type { ReactElement } from 'react'
import type {
  AlertBehavior,
  AlertRequest,
  ConfirmActionStatus,
  ConfirmBehavior,
  ConfirmRequest,
  OpenOptions,
  OverlayClient,
  OverlayOutcome,
  OverlayRequestMap,
} from './contract'
import { createOverlayRuntime, type OverlayRuntime } from './runtime'

export type AlertSessionPayload<Request extends object> = {
  type: 'alert'
  request: Request
  behavior: AlertBehavior
}

export type ConfirmSessionPayload<Request extends object> = {
  type: 'confirm'
  request: Request
  behavior: {
    onConfirm?: () => void | Promise<void>
    closeOnEscape: boolean
    closeOnOutsidePress: boolean
  }
  actionStatus: ConfirmActionStatus
  error: unknown | null
}

export type CustomSessionPayload = {
  type: 'custom'
  element: ReactElement
}

export type OverlayClientSessionPayload<Requests extends OverlayRequestMap> =
  | AlertSessionPayload<Requests['alert']>
  | ConfirmSessionPayload<Requests['confirm']>
  | CustomSessionPayload

type ScopedClientInternals = {
  runtime: OverlayRuntime
  scopeToken: object
}

const clientInternals = new WeakMap<object, ScopedClientInternals>()

function splitAlertRequest<Fields extends object>(input: AlertRequest<Fields>) {
  const { onAction, ...request } = input as Record<string, unknown> & AlertBehavior
  const behavior: AlertBehavior = onAction === undefined ? {} : { onAction }

  return {
    behavior,
    request: request as Fields,
  }
}

function splitConfirmRequest<Fields extends object>(input: ConfirmRequest<Fields>) {
  const { closeOnEscape, closeOnOutsidePress, onConfirm, ...request } = input as Record<
    string,
    unknown
  > &
    ConfirmBehavior
  const behavior: ConfirmSessionPayload<Fields>['behavior'] = {
    closeOnEscape: closeOnEscape ?? true,
    closeOnOutsidePress: closeOnOutsidePress ?? true,
    ...(onConfirm === undefined ? {} : { onConfirm }),
  }

  return {
    behavior,
    request: request as Fields,
  }
}

export function createScopedOverlayClient<Requests extends OverlayRequestMap>(
  scopeToken: object,
): OverlayClient<Requests> {
  const runtime = createOverlayRuntime()

  const client: OverlayClient<Requests> = {
    alert(input) {
      const { behavior, request } = splitAlertRequest(input)
      return runtime.createSession({
        kind: 'alert',
        payload: {
          type: 'alert',
          request,
          behavior,
        } satisfies AlertSessionPayload<Requests['alert']>,
        closeValue: () => undefined,
        closeOnEscape: false,
        closeOnOutsidePress: false,
      }).handle
    },

    confirm(input) {
      const { behavior, request } = splitConfirmRequest(input)
      return runtime.createSession({
        kind: 'confirm',
        payload: {
          type: 'confirm',
          request,
          behavior,
          actionStatus: 'idle',
          error: null,
        } satisfies ConfirmSessionPayload<Requests['confirm']>,
        closeValue: () => false,
        closeOnEscape: behavior.closeOnEscape,
        closeOnOutsidePress: behavior.closeOnOutsidePress,
      }).handle
    },

    open<Result = void>(element: ReactElement, options: OpenOptions = {}) {
      return runtime.createSession<'custom', CustomSessionPayload, OverlayOutcome<Result>>({
        kind: 'custom',
        payload: {
          type: 'custom',
          element,
        },
        closeValue: (reason) => ({ status: 'closed', reason }),
        closeOnEscape: options.closeOnEscape ?? true,
        closeOnOutsidePress: options.closeOnOutsidePress ?? true,
      }).handle
    },

    close: (reason) => runtime.close(reason),
    closeAll: (reason) => runtime.closeAll(reason),
  }

  clientInternals.set(client, { runtime, scopeToken })
  return client
}

export function getScopedClientInternals<Requests extends OverlayRequestMap>(
  client: OverlayClient<Requests>,
  expectedScopeToken?: object,
): ScopedClientInternals {
  const internals = clientInternals.get(client)
  if (
    !internals ||
    (expectedScopeToken !== undefined && internals.scopeToken !== expectedScopeToken)
  ) {
    throw new Error('OverlayProvider의 client는 같은 createOverlayScope()에서 생성해야 합니다.')
  }
  return internals
}
