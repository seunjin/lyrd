import { useEffect, useRef } from 'react'

export function useScheduledCommand() {
  const timers = useRef(new Set<number>())

  useEffect(
    () => () => {
      for (const timer of timers.current) window.clearTimeout(timer)
      timers.current.clear()
    },
    [],
  )

  return (command: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      timers.current.delete(timer)
      command()
    }, delay)
    timers.current.add(timer)
  }
}
