import type { Preview } from '@storybook/react-vite'
import { OverlayProvider } from '../src/overlays/OverlayProvider'
import { AppToastProvider } from '../src/overlays/toast/AppToastProvider'
import '../src/preview.css'

const preview: Preview = {
  decorators: [
    (Story) => (
      <>
        <AppToastProvider />
        <OverlayProvider>
          <Story />
        </OverlayProvider>
      </>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
}

export default preview
