'use client'

import type { ReactNode } from 'react'

import { OverlayProvider } from '../overlays/OverlayProvider'
import { AppToastProvider } from '../overlays/toast'

export function LyrdOverlayProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <AppToastProvider />
      <OverlayProvider>{children}</OverlayProvider>
    </>
  )
}
