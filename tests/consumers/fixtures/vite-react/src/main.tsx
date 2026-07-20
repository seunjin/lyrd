import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './app'
import { AppOverlayProvider } from './lyrd/overlay/overlay-provider'
import { AppToastProvider } from './lyrd/overlay/toast'
import './styles.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing #root element')

createRoot(rootElement).render(
  <StrictMode>
    <AppToastProvider>
      <AppOverlayProvider>
        <App />
      </AppOverlayProvider>
    </AppToastProvider>
  </StrictMode>,
)
