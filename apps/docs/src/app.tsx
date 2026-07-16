import { RouterProvider } from 'react-router-dom'

import { AppOverlayProvider } from './lyrd/overlay-provider'
import { router } from './router'

export function App() {
  return (
    <AppOverlayProvider>
      <RouterProvider router={router} />
    </AppOverlayProvider>
  )
}
