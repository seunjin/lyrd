'use client'

import type { OverlayRenderers } from '@lyrd/core'
import type { ReactNode } from 'react'

import { AlertSurface } from './alert/AlertSurface'
import { ConfirmSurface } from './confirm/ConfirmSurface'
import { type AppOverlayRequests, appOverlay } from './scope'

const renderers = {
  alert: AlertSurface,
  confirm: ConfirmSurface,
} satisfies OverlayRenderers<AppOverlayRequests>

export function OverlayProvider({ children }: { children: ReactNode }) {
  return <appOverlay.OverlayProvider renderers={renderers}>{children}</appOverlay.OverlayProvider>
}
