import { createOverlayScope } from '@lyrd/core'
import type { ReactNode } from 'react'

import type { PlaygroundInstrumentation } from '../playground-events'

export type AppAlertRequest = {
  title: ReactNode
  description?: ReactNode
  actionLabel?: ReactNode
  playground?: PlaygroundInstrumentation
}

export type AppConfirmRequest = {
  title: ReactNode
  description?: ReactNode
  confirmLabel?: ReactNode
  cancelLabel?: ReactNode
  tone?: 'neutral' | 'danger'
  onCancel?: () => void
  playground?: PlaygroundInstrumentation
}

export type AppOverlayRequests = {
  alert: AppAlertRequest
  confirm: AppConfirmRequest
}

export const appOverlay = createOverlayScope<AppOverlayRequests>()
export const useOverlay = appOverlay.useOverlay
