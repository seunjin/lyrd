import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react'
import {
  createOverlayController,
  type OverlayController,
  type OverlayDefinitionSnapshot,
} from './controller'
import type { OverlayApi, OverlayDialogApi, OverlayRenderers } from './types'

const OverlayContext = createContext<OverlayApi | null>(null)
const OverlayDialogContext = createContext<OverlayDialogApi<unknown> | null>(null)

export type OverlayProviderProps = {
  children: React.ReactNode
  renderers: OverlayRenderers
  controller?: OverlayController
}

function DefinitionSurface({
  controller,
  snapshot,
}: {
  controller: OverlayController
  snapshot: OverlayDefinitionSnapshot
}) {
  const Surface = snapshot.definition.component
  const sessionId = snapshot.sessionId

  return (
    <Surface
      input={snapshot.input}
      session={{
        open: snapshot.open,
        status: snapshot.status,
        resolve: (result) => controller.resolveDefinition(sessionId, result),
        dismiss: (reason) => controller.dismissDefinition(sessionId, reason),
        requestClose: (reason) => controller.requestDefinitionClose(sessionId, reason),
        completeClose: () => controller.completeDefinitionClose(sessionId),
      }}
    />
  )
}

export function OverlayProvider({ children, renderers, controller }: OverlayProviderProps) {
  const [internalController] = useState(createOverlayController)
  const activeController = controller ?? internalController
  const snapshot = useSyncExternalStore(
    activeController.subscribe,
    activeController.getSnapshot,
    activeController.getSnapshot,
  )
  const parallelSnapshots = useSyncExternalStore(
    activeController.subscribe,
    activeController.getParallelSnapshots,
    activeController.getParallelSnapshots,
  )
  const AlertSurface = renderers.alert
  const ConfirmSurface = renderers.confirm

  useEffect(() => {
    if (snapshot.status === 'mounting') activeController.openCurrent()
  }, [activeController, snapshot.status])

  useEffect(() => {
    for (const parallelSnapshot of parallelSnapshots) {
      if (parallelSnapshot.status === 'mounting') {
        activeController.openDefinition(parallelSnapshot.sessionId)
      }
    }
  }, [activeController, parallelSnapshots])

  return (
    <OverlayContext.Provider value={activeController.overlay}>
      {children}
      {snapshot.kind === 'alert' ? (
        <AlertSurface
          acknowledge={activeController.acknowledgeCurrent}
          completeClose={activeController.completeClose}
          open={snapshot.open}
          request={snapshot.request}
          requestClose={activeController.requestClose}
          status={snapshot.status}
        />
      ) : null}
      {snapshot.kind === 'confirm' ? (
        <ConfirmSurface
          cancel={activeController.cancelCurrent}
          completeClose={activeController.completeClose}
          confirm={activeController.confirmCurrent}
          error={snapshot.error}
          open={snapshot.open}
          request={snapshot.request}
          requestClose={activeController.requestClose}
          status={snapshot.status}
        />
      ) : null}
      {snapshot.kind === 'dialog' ? (
        <OverlayDialogContext.Provider
          value={{
            open: snapshot.open,
            status: snapshot.status,
            resolve: activeController.resolveDialogCurrent,
            dismiss: activeController.dismissDialogCurrent,
            requestClose: activeController.requestClose,
            completeClose: activeController.completeClose,
          }}
        >
          {snapshot.element}
        </OverlayDialogContext.Provider>
      ) : null}
      {snapshot.kind === 'definition' ? (
        <DefinitionSurface controller={activeController} snapshot={snapshot} />
      ) : null}
      {parallelSnapshots.map((parallelSnapshot) => (
        <DefinitionSurface
          controller={activeController}
          key={parallelSnapshot.sessionId}
          snapshot={parallelSnapshot}
        />
      ))}
    </OverlayContext.Provider>
  )
}

export function useOverlay(): OverlayApi {
  const overlay = useContext(OverlayContext)
  if (!overlay) throw new Error('useOverlay()는 <OverlayProvider> 안에서 사용해야 합니다.')
  return overlay
}

export function useOverlayDialog<Result>(): OverlayDialogApi<Result> {
  const dialog = useContext(OverlayDialogContext)
  if (!dialog) {
    throw new Error('useOverlayDialog()는 overlay.dialog()로 열린 컴포넌트 안에서 사용해야 합니다.')
  }
  return dialog as OverlayDialogApi<Result>
}
