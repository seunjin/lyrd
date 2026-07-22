import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './app'
import { OverlayProvider } from './overlays/OverlayProvider'
import { AppToastProvider } from './overlays/toast'
import './styles.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing #root element')

createRoot(rootElement).render(
  <StrictMode>
    <AppToastProvider />
    <OverlayProvider>
      <App />
    </OverlayProvider>
  </StrictMode>,
)
