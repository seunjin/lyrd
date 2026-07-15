import type { OverlayGroup, OverlayGroupOptions } from './types'

export function defineOverlayGroup(options: OverlayGroupOptions): OverlayGroup {
  if (options.strategy !== 'parallel') {
    throw new Error(`지원하지 않는 overlay group strategy입니다: ${String(options.strategy)}`)
  }
  return Object.freeze({ strategy: options.strategy }) as OverlayGroup
}
