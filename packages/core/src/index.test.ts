import { describe, expect, it } from 'vitest'
import * as core from './index'

describe('@lyrd/core public runtime exports', () => {
  it('새 scope API만 노출한다', () => {
    expect(Object.keys(core).sort()).toEqual(['createOverlayScope', 'useOverlaySession'])
  })
})
