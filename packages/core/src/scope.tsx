import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react'
import {
  type AlertSessionPayload,
  type ConfirmSessionPayload,
  type CustomSessionPayload,
  createScopedOverlayClient,
  getScopedClientInternals,
} from './client'
import type {
  CreateOverlayScope,
  OverlayClient,
  OverlayRenderers,
  OverlayRequestMap,
  OverlayScope,
  OverlaySession,
} from './contract'
import { createAlertRendererProps, createConfirmRendererProps } from './recipes'
import type { OverlayRuntime, OverlayRuntimeSessionSnapshot } from './runtime'

const OverlaySessionContext = createContext<OverlaySession<unknown> | null>(null)
const providerMountCounts = new WeakMap<OverlayRuntime, number>()

export function retainOverlayRuntime(runtime: OverlayRuntime): () => void {
  providerMountCounts.set(runtime, (providerMountCounts.get(runtime) ?? 0) + 1)

  return () => {
    const remainingMounts = Math.max((providerMountCounts.get(runtime) ?? 1) - 1, 0)
    providerMountCounts.set(runtime, remainingMounts)

    queueMicrotask(() => {
      if ((providerMountCounts.get(runtime) ?? 0) !== 0) return
      runtime.dispose('programmatic')
      providerMountCounts.delete(runtime)
    })
  }
}

function CustomSessionSurface({
  runtime,
  snapshot,
}: {
  runtime: OverlayRuntime
  snapshot: OverlayRuntimeSessionSnapshot<'custom', CustomSessionPayload>
}) {
  const sessionId = snapshot.id
  const session: OverlaySession<unknown> = {
    open: snapshot.open,
    phase: snapshot.phase,
    resolve: (value) =>
      runtime.resolveSession(sessionId, {
        status: 'resolved',
        value,
      }),
    close: (reason) => runtime.closeSession(sessionId, reason),
    requestClose: (reason) => runtime.requestClose(sessionId, reason),
    completeClose: () => runtime.completeClose(sessionId),
  }

  return (
    <OverlaySessionContext.Provider value={session}>
      {snapshot.payload.element}
    </OverlaySessionContext.Provider>
  )
}

function AlertSessionSurface<Request extends object>({
  runtime,
  snapshot,
  Renderer,
}: {
  runtime: OverlayRuntime
  snapshot: OverlayRuntimeSessionSnapshot<'alert', AlertSessionPayload<Request>>
  Renderer: OverlayRenderers<{ alert: Request; confirm: object }>['alert']
}) {
  return <Renderer {...createAlertRendererProps(runtime, snapshot)} />
}

function ConfirmSessionSurface<Request extends object>({
  runtime,
  snapshot,
  Renderer,
}: {
  runtime: OverlayRuntime
  snapshot: OverlayRuntimeSessionSnapshot<'confirm', ConfirmSessionPayload<Request>>
  Renderer: OverlayRenderers<{ alert: object; confirm: Request }>['confirm']
}) {
  return <Renderer {...createConfirmRendererProps(runtime, snapshot)} />
}

type ScopeOverlayProviderProps<Requests extends OverlayRequestMap> = {
  children?: ReactNode
  client?: OverlayClient<Requests>
  renderers: OverlayRenderers<Requests>
}

function createOverlayScopeInternal<Requests extends OverlayRequestMap>(): OverlayScope<Requests> {
  const scopeToken = {}
  const OverlayClientContext = createContext<OverlayClient<Requests> | null>(null)

  function createClient(): OverlayClient<Requests> {
    return createScopedOverlayClient<Requests>(scopeToken)
  }

  function OverlayProvider({ children, client, renderers }: ScopeOverlayProviderProps<Requests>) {
    const [internalClient] = useState(createClient)
    const activeClient = client ?? internalClient
    const { runtime } = getScopedClientInternals(activeClient, scopeToken)
    const snapshots = useSyncExternalStore(
      runtime.subscribe,
      runtime.getSnapshot,
      runtime.getSnapshot,
    )

    useEffect(() => retainOverlayRuntime(runtime), [runtime])

    useEffect(() => {
      for (const snapshot of snapshots) {
        if (snapshot.phase === 'opening') runtime.markOpen(snapshot.id)
      }
    }, [runtime, snapshots])

    return (
      <OverlayClientContext.Provider value={activeClient}>
        {children}
        {snapshots.map((snapshot) => {
          if (snapshot.kind === 'alert') {
            return (
              <AlertSessionSurface
                key={snapshot.id}
                runtime={runtime}
                snapshot={
                  snapshot as OverlayRuntimeSessionSnapshot<
                    'alert',
                    AlertSessionPayload<Requests['alert']>
                  >
                }
                Renderer={renderers.alert}
              />
            )
          }

          if (snapshot.kind === 'confirm') {
            return (
              <ConfirmSessionSurface
                key={snapshot.id}
                runtime={runtime}
                snapshot={
                  snapshot as OverlayRuntimeSessionSnapshot<
                    'confirm',
                    ConfirmSessionPayload<Requests['confirm']>
                  >
                }
                Renderer={renderers.confirm}
              />
            )
          }

          return snapshot.kind === 'custom' ? (
            <CustomSessionSurface
              key={snapshot.id}
              runtime={runtime}
              snapshot={snapshot as OverlayRuntimeSessionSnapshot<'custom', CustomSessionPayload>}
            />
          ) : null
        })}
      </OverlayClientContext.Provider>
    )
  }

  OverlayProvider.displayName = 'LyrdOverlayProvider'

  function useOverlay(): OverlayClient<Requests> {
    const client = useContext(OverlayClientContext)
    if (!client) {
      throw new Error('useOverlay()는 같은 scope의 <OverlayProvider> 안에서 사용해야 합니다.')
    }
    return client
  }

  return {
    OverlayProvider,
    useOverlay,
    createClient,
  }
}

export const createOverlayScope = createOverlayScopeInternal as CreateOverlayScope

export function useOverlaySession<Result = void>(): OverlaySession<Result> {
  const session = useContext(OverlaySessionContext)
  if (!session) {
    throw new Error(
      'useOverlaySession()은 overlay.open()으로 열린 컴포넌트 안에서 사용해야 합니다.',
    )
  }
  return session as OverlaySession<Result>
}
