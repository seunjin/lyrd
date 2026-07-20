import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { LyrdOverlayProvider } from './lyrd-overlay-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lyrd Next consumer',
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <LyrdOverlayProvider>{children}</LyrdOverlayProvider>
      </body>
    </html>
  )
}
