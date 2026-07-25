import type { Preview } from '@storybook/react-vite'
import { OverlayProvider } from '../src/overlays/OverlayProvider'
import '../src/preview.css'

const preview: Preview = {
  decorators: [
    (Story) => (
      <OverlayProvider>
        <Story />
      </OverlayProvider>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
}

export default preview
