import type { OverlayDefinitionComponentProps } from '@lyrd/core'
import { defineOverlay } from '@lyrd/core'
import { useEffect, useRef } from 'react'

import { appToastManager } from './manager'

export type AppToastInput = {
  actionLabel?: string
  description?: string
  timeout?: number
  title: string
  toastId: string
}

export type AppToastResult = { action: 'undo' }

type AppToastProps = OverlayDefinitionComponentProps<AppToastInput, AppToastResult>

function AppToast({ input, session }: AppToastProps) {
  const inputRef = useRef(input)
  const sessionRef = useRef(session)
  const addedRef = useRef(false)

  inputRef.current = input
  sessionRef.current = session

  useEffect(() => {
    if (!session.open) {
      if (addedRef.current) {
        appToastManager.close(input.toastId)
      }
      return
    }

    if (addedRef.current) return

    addedRef.current = true
    const currentInput = inputRef.current

    appToastManager.add({
      id: currentInput.toastId,
      title: currentInput.title,
      description: currentInput.description,
      timeout: currentInput.timeout,
      data: currentInput.actionLabel
        ? {
            undo: () => sessionRef.current.resolve({ action: 'undo' }),
            undoLabel: currentInput.actionLabel,
            dismiss: () => sessionRef.current.dismiss('cancel'),
          }
        : {
            dismiss: () => sessionRef.current.dismiss('cancel'),
          },
      onClose: () => sessionRef.current.dismiss('programmatic'),
      onRemove: () => sessionRef.current.completeExit(),
    })
  }, [input.toastId, session.open])

  return null
}

export const appToast = defineOverlay(AppToast)
