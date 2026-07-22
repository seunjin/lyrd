'use client'

import { OverlayProvider as CoreOverlayProvider } from '@lyrd/core'
import type { ReactNode } from 'react'

import { AlertSurface } from './alert/AlertSurface'
import { ConfirmSurface } from './confirm/ConfirmSurface'

export function OverlayProvider({ children }: { children: ReactNode }) {
  return (
    <CoreOverlayProvider renderers={{ alert: AlertSurface, confirm: ConfirmSurface }}>
      {children}
    </CoreOverlayProvider>
  )
}
