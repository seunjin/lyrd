'use client'

import type { ReactNode } from 'react'

import { OverlayProvider } from '../overlays/OverlayProvider'

export function LyrdOverlayProvider({ children }: { children: ReactNode }) {
  return <OverlayProvider>{children}</OverlayProvider>
}
