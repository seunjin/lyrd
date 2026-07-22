import { Toast } from '@base-ui/react/toast'

export type AppToastData = {
  dismiss: () => void
  undo?: () => void
  undoLabel?: string
}

export const appToastManager = Toast.createToastManager<AppToastData>()
