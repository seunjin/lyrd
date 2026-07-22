import { RouterProvider } from 'react-router-dom'

import { OverlayProvider } from './overlays/OverlayProvider'
import { router } from './router'

export function App() {
  return (
    <OverlayProvider>
      <RouterProvider router={router} />
    </OverlayProvider>
  )
}
