import { OverlayProvider } from '@lyrd/core'
import type { Preview } from '@storybook/react-vite'
import { AlertSurface } from '../src/lyrd/alert'
import { ConfirmSurface } from '../src/lyrd/confirm'
import { AppToastProvider } from '../src/lyrd/toast'
import '../src/preview.css'

const preview: Preview = {
  decorators: [
    (Story) => (
      <AppToastProvider>
        <OverlayProvider renderers={{ alert: AlertSurface, confirm: ConfirmSurface }}>
          <Story />
        </OverlayProvider>
      </AppToastProvider>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
}

export default preview
