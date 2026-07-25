'use client'

import type { OverlayRenderers } from '@lyrd/core'
import type { ReactNode } from 'react'

import { AlertSurface } from './alert/AlertSurface'
import { ConfirmSurface } from './confirm/ConfirmSurface'
import { type StorybookOverlayRequests, storybookOverlay } from './scope'

const renderers = {
  alert: AlertSurface,
  confirm: ConfirmSurface,
} satisfies OverlayRenderers<StorybookOverlayRequests>

export function OverlayProvider({ children }: { children: ReactNode }) {
  return (
    <storybookOverlay.OverlayProvider renderers={renderers}>
      {children}
    </storybookOverlay.OverlayProvider>
  )
}
