import type { ComponentType } from 'react'
import type { OverlayDefinition, OverlayDefinitionComponentProps } from './types'

export function defineOverlay<Input, Result>(
  component: ComponentType<OverlayDefinitionComponentProps<Input, Result>>,
): OverlayDefinition<Input, Result> {
  return { component }
}
