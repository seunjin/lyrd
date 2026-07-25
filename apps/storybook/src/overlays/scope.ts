import { createOverlayScope } from '@lyrd/core'
import type { ReactNode } from 'react'

export type AppAlertRequest = {
  title: ReactNode
  description?: ReactNode
  actionLabel?: ReactNode
}

export type AppConfirmRequest = {
  title: ReactNode
  description?: ReactNode
  confirmLabel?: ReactNode
  cancelLabel?: ReactNode
  tone?: 'neutral' | 'danger'
  onCancel?: () => void
}

export type AppOverlayRequests = {
  alert: AppAlertRequest
  confirm: AppConfirmRequest
}

export const appOverlay = createOverlayScope<AppOverlayRequests>()
export const useOverlay = appOverlay.useOverlay
