import type { OverlayApi } from '@lyrd/core'
import { defineOverlayGroup } from '@lyrd/core'

import type { AppToastInput } from './definition'
import { appToast } from './definition'

export const toastGroup = defineOverlayGroup({ strategy: 'parallel' })

type ToastMessage = Omit<AppToastInput, 'actionLabel' | 'toastId'>

export function showToast(overlay: OverlayApi, input: ToastMessage) {
  return overlay.open(
    appToast,
    {
      ...input,
      toastId: crypto.randomUUID(),
    },
    { group: toastGroup },
  )
}

export function notify(overlay: OverlayApi, input: ToastMessage): void {
  void showToast(overlay, input)
}

export async function notifyWithUndo(
  overlay: OverlayApi,
  input: ToastMessage,
): Promise<'dismissed' | 'undo'> {
  const outcome = await overlay.open(
    appToast,
    {
      ...input,
      actionLabel: '실행 취소',
      toastId: crypto.randomUUID(),
    },
    { group: toastGroup },
  )

  return outcome.status === 'resolved' ? outcome.value.action : 'dismissed'
}
