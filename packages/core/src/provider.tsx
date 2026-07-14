import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react'
import { createOverlayController, type OverlayController } from './controller'
import type { OverlayApi, OverlayDialogApi, OverlayRenderers } from './types'

const OverlayContext = createContext<OverlayApi | null>(null)
const OverlayDialogContext = createContext<OverlayDialogApi<unknown> | null>(null)

export type OverlayProviderProps = {
  children: React.ReactNode
  renderers: OverlayRenderers
  controller?: OverlayController
}

export function OverlayProvider({ children, renderers, controller }: OverlayProviderProps) {
  const [internalController] = useState(createOverlayController)
  const activeController = controller ?? internalController
  const snapshot = useSyncExternalStore(
    activeController.subscribe,
    activeController.getSnapshot,
    activeController.getSnapshot,
  )
  const AlertSurface = renderers.alert
  const ConfirmSurface = renderers.confirm

  useEffect(() => {
    if (snapshot.status === 'mounting') activeController.openCurrent()
  }, [activeController, snapshot.status])

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
