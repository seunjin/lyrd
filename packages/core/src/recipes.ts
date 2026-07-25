import type { AlertSessionPayload, ConfirmSessionPayload } from './client'
import type { AlertRendererProps, ConfirmRendererProps } from './contract'
import {
  isDevelopmentRuntime,
  type OverlayRuntime,
  type OverlayRuntimeSessionSnapshot,
} from './runtime'

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    ((typeof value === 'object' && value !== null) || typeof value === 'function') &&
    typeof (value as PromiseLike<unknown>).then === 'function'
  )
}

function getAlertPayload<Request extends object>(
  runtime: OverlayRuntime,
  sessionId: number,
): AlertSessionPayload<Request> | undefined {
  const snapshot = runtime.getSessionSnapshot(sessionId)
  if (snapshot?.kind !== 'alert') return undefined
  return snapshot.payload as AlertSessionPayload<Request>
}

function getConfirmPayload<Request extends object>(
  runtime: OverlayRuntime,
  sessionId: number,
): ConfirmSessionPayload<Request> | undefined {
  const snapshot = runtime.getSessionSnapshot(sessionId)
  if (snapshot?.kind !== 'confirm') return undefined
  return snapshot.payload as ConfirmSessionPayload<Request>
}

function setConfirmError<Request extends object>(
  runtime: OverlayRuntime,
  sessionId: number,
  error: unknown,
) {
  runtime.updateSessionPayload<ConfirmSessionPayload<Request>>(sessionId, (payload) => ({
    ...payload,
    actionStatus: 'error',
    error,
  }))
}

export function createAlertRendererProps<Request extends object>(
  runtime: OverlayRuntime,
  snapshot: OverlayRuntimeSessionSnapshot<'alert', AlertSessionPayload<Request>>,
): AlertRendererProps<Request> {
  const sessionId = snapshot.id

  return {
    open: snapshot.open,
    phase: snapshot.phase,
    request: snapshot.payload.request,
    action() {
      if (!runtime.isSessionActive(sessionId)) return

      try {
        const result = (
          getAlertPayload<Request>(runtime, sessionId)?.behavior.onAction as
            | (() => unknown)
            | undefined
        )?.()

        if (isThenable(result) && isDevelopmentRuntime()) {
          console.warn(
            '[Lyrd] alert.onAction은 동기 작업만 지원합니다. 비동기 작업은 confirm 또는 open을 사용하세요.',
          )
        }

        runtime.resolveSession(sessionId, undefined)
      } catch (error) {
        runtime.resolveSession(sessionId, undefined)
        throw error
      }
    },
    completeClose: () => runtime.completeClose(sessionId),
  }
}

export function createConfirmRendererProps<Request extends object>(
  runtime: OverlayRuntime,
  snapshot: OverlayRuntimeSessionSnapshot<'confirm', ConfirmSessionPayload<Request>>,
): ConfirmRendererProps<Request> {
  const sessionId = snapshot.id

  return {
    open: snapshot.open,
    phase: snapshot.phase,
    actionStatus: snapshot.payload.actionStatus,
    error: snapshot.payload.error,
    request: snapshot.payload.request,
    confirm() {
      const payload = getConfirmPayload<Request>(runtime, sessionId)
      if (!runtime.isSessionActive(sessionId) || !payload || payload.actionStatus === 'pending') {
        return
      }

      const onConfirm = payload.behavior.onConfirm
      if (!onConfirm) {
        runtime.resolveSession(sessionId, true)
        return
      }

      try {
        const result = onConfirm()

        if (!isThenable(result)) {
          runtime.resolveSession(sessionId, true)
          return
        }

        if (
          !runtime.updateSessionPayload<ConfirmSessionPayload<Request>>(sessionId, (current) => ({
            ...current,
            actionStatus: 'pending',
            error: null,
          }))
        ) {
          return
        }

        void Promise.resolve(result).then(
          () => {
            if (runtime.isSessionActive(sessionId)) runtime.resolveSession(sessionId, true)
          },
          (error: unknown) => {
            if (runtime.isSessionActive(sessionId)) {
              setConfirmError<Request>(runtime, sessionId, error)
            }
          },
        )
      } catch (error) {
        if (runtime.isSessionActive(sessionId)) {
          setConfirmError<Request>(runtime, sessionId, error)
        }
      }
    },
    cancel() {
      const payload = getConfirmPayload<Request>(runtime, sessionId)
      if (!payload || payload.actionStatus === 'pending') return
      runtime.resolveSession(sessionId, false)
    },
    requestClose(reason) {
      const payload = getConfirmPayload<Request>(runtime, sessionId)
      if (!payload || payload.actionStatus === 'pending') return
      runtime.requestClose(sessionId, reason)
    },
    completeClose: () => runtime.completeClose(sessionId),
  }
}
