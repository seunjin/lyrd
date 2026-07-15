'use client'

import { Toast } from '@base-ui/react/toast'
import type { OverlayDefinitionComponentProps } from '@lyrd/core'
import { defineOverlay, defineOverlayGroup } from '@lyrd/core'
import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'

import './toast.css'

export const toastGroup = defineOverlayGroup({ strategy: 'parallel' })

export type AppToastInput = {
  toastId: string
  title: string
  description: string
  timeout?: number
}

export type AppToastResult = {
  action: 'undo'
}

type AppToastData = {
  undo: () => void
  dismiss: () => void
}

type AppToastProps = OverlayDefinitionComponentProps<AppToastInput, AppToastResult>

function AppToast({ input, session }: AppToastProps) {
  const { add, close } = Toast.useToastManager<AppToastData>()
  const inputRef = useRef(input)
  const sessionRef = useRef(session)
  const addedRef = useRef(false)
  inputRef.current = input
  sessionRef.current = session

  useEffect(() => {
    if (!session.open) {
      if (addedRef.current) close(input.toastId)
      return
    }
    if (addedRef.current) return

    addedRef.current = true
    const currentInput = inputRef.current
    add({
      id: currentInput.toastId,
      title: currentInput.title,
      description: currentInput.description,
      timeout: currentInput.timeout,
      data: {
        undo: () => sessionRef.current.resolve({ action: 'undo' }),
        dismiss: () => sessionRef.current.dismiss('cancel'),
      },
      onClose: () => sessionRef.current.dismiss('programmatic'),
      onRemove: () => sessionRef.current.completeClose(),
    })
  }, [add, close, input.toastId, session.open])

  return null
}

export const appToast = defineOverlay(AppToast)

function ToastRegion() {
  const { toasts } = Toast.useToastManager<AppToastData>()

  return (
    <Toast.Portal>
      <Toast.Viewport className="lyrd-toast-viewport">
        {toasts.map((toast) => (
          <Toast.Root className="lyrd-toast-root" key={toast.id} toast={toast}>
            <Toast.Content className="lyrd-toast-content">
              <div>
                <Toast.Title className="lyrd-toast-title" />
                <Toast.Description className="lyrd-toast-description" />
              </div>
              <div className="lyrd-toast-actions">
                <Toast.Action className="lyrd-toast-action" onClick={toast.data?.undo}>
                  실행 취소
                </Toast.Action>
                <Toast.Close
                  aria-label="알림 닫기"
                  className="lyrd-toast-close"
                  onClickCapture={toast.data?.dismiss}
                >
                  ×
                </Toast.Close>
              </div>
            </Toast.Content>
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  )
}

export function AppToastProvider({ children }: { children: ReactNode }) {
  return (
    <Toast.Provider limit={5} timeout={5000}>
      {children}
      <ToastRegion />
    </Toast.Provider>
  )
}
