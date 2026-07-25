import { createOverlayScope } from '@lyrd/core'
import type { ReactNode } from 'react'

export type StorybookAlertRequest = {
  title: ReactNode
  description?: ReactNode
  actionLabel?: ReactNode
}

export type StorybookConfirmRequest = {
  title: ReactNode
  description?: ReactNode
  confirmLabel?: ReactNode
  cancelLabel?: ReactNode
  tone?: 'neutral' | 'danger'
  onCancel?: () => void
}

export type StorybookOverlayRequests = {
  alert: StorybookAlertRequest
  confirm: StorybookConfirmRequest
}

export const storybookOverlay = createOverlayScope<StorybookOverlayRequests>()
export const useOverlay = storybookOverlay.useOverlay
