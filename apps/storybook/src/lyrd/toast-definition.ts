import { Toast } from '@base-ui/react/toast'
import type { OverlayDefinitionComponentProps } from '@lyrd/core'
import { defineOverlay } from '@lyrd/core'
import { useEffect, useRef } from 'react'

export type AppToastInput = {
  actionLabel?: string
  description?: string
  timeout?: number
  title: string
  toastId: string
}

export type AppToastResult = { action: 'undo' }

export type AppToastData = {
  dismiss: () => void
  undo?: () => void
  undoLabel?: string
}

type AppToastProps = OverlayDefinitionComponentProps<AppToastInput, AppToastResult>

function AppToast({ input, session }: AppToastProps) {
  const { add, close } = Toast.useToastManager<AppToastData>()
  const inputRef = useRef(input)
  const sessionRef = useRef(session)
  const addedRef = useRef(false)

  inputRef.current = input
  sessionRef.current = session

  useEffect(() => {
    if (!session.open) {
      if (addedRef.current) {
        close(input.toastId)
      }
      return
    }

    if (addedRef.current) return

    addedRef.current = true
    const currentInput = inputRef.current

    add({
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
      onRemove: () => sessionRef.current.completeClose(),
    })
  }, [add, close, input.toastId, session.open])

  return null
}

export const appToast = defineOverlay(AppToast)
