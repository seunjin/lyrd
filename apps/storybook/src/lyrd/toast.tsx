'use client'

import { Toast } from '@base-ui/react/toast'
import type { ReactNode } from 'react'

import type { AppToastData } from './toast-definition'
import './toast.css'

function ToastRegion() {
  const { toasts } = Toast.useToastManager<AppToastData>()

  return (
    <Toast.Portal>
      <Toast.Viewport aria-label="알림" className="lyrd-toast-viewport">
        {toasts.map((toast) => (
          <Toast.Root className="lyrd-toast" key={toast.id} toast={toast}>
            <Toast.Content className="lyrd-toast-content">
              <Toast.Title className="lyrd-toast-title" />
              <Toast.Description className="lyrd-toast-description" />
            </Toast.Content>
            <div className="lyrd-toast-actions">
              {toast.data?.undo ? (
                <Toast.Action className="lyrd-toast-undo" onClick={toast.data.undo}>
                  {toast.data.undoLabel}
                </Toast.Action>
              ) : null}
              <Toast.Close className="lyrd-toast-close" onClickCapture={toast.data?.dismiss}>
                닫기
              </Toast.Close>
            </div>
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
