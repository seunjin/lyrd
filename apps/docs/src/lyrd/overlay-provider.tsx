import { OverlayProvider } from '@lyrd/core'
import type { ReactNode } from 'react'

import { AlertSurface } from './alert'
import { ConfirmSurface } from './confirm'

export function AppOverlayProvider({ children }: { children: ReactNode }) {
  return (
    <OverlayProvider renderers={{ alert: AlertSurface, confirm: ConfirmSurface }}>
      {children}
    </OverlayProvider>
  )
}
