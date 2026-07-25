import { afterEach, describe, expect, it, vi } from 'vitest'
import type { OpenOptions, OverlayOutcome } from './contract'
import { createOverlayRuntime, type OverlayRuntime } from './runtime'

function createCustom<Result = void>(
  runtime: OverlayRuntime,
  label: string,
  options: OpenOptions = {},
) {
  return runtime.createSession<'custom', { label: string }, OverlayOutcome<Result>>({
    kind: 'custom',
    payload: { label },
    closeValue: (reason) => ({ status: 'closed', reason }),
    ...options,
  })
}

function createConfirm(runtime: OverlayRuntime, label: string) {
  return runtime.createSession({
    kind: 'confirm',
    payload: { label },
    closeValue: () => false,
  })
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('overlay stack runtime', () => {
  it('마지막에 열린 session을 먼저 닫는 LIFO stack을 유지한다', async () => {
    const runtime = createOverlayRuntime()
    const first = createConfirm(runtime, 'first')
    const second = createConfirm(runtime, 'second')

    runtime.markOpen(first.id)
    runtime.markOpen(second.id)

    expect(runtime.close()).toBe(true)
    await expect(second.handle).resolves.toBe(false)
    expect(runtime.getSnapshot()).toMatchObject([
      { id: first.id, open: true, phase: 'open' },
      { id: second.id, open: false, phase: 'closing' },
    ])

    let firstSettled = false
    void first.handle.then(() => {
      firstSettled = true
    })
    await Promise.resolve()
    expect(firstSettled).toBe(false)
  })

  it('부모 custom overlay에서 기다리는 Confirm을 위에 열어도 교착되지 않는다', async () => {
    const runtime = createOverlayRuntime()
    const parent = createCustom<{ saved: true }>(runtime, 'parent')
    runtime.markOpen(parent.id)

    const child = createConfirm(runtime, 'child')
    runtime.markOpen(child.id)
    expect(runtime.resolveSession(child.id, true)).toBe(true)
    await expect(child.handle).resolves.toBe(true)
    runtime.completeClose(child.id)

    expect(runtime.getSnapshot()).toMatchObject([
      { id: parent.id, open: true, phase: 'open', payload: { label: 'parent' } },
    ])

    expect(
      runtime.resolveSession(parent.id, {
        status: 'resolved',
        value: { saved: true },
      } satisfies OverlayOutcome<{ saved: true }>),
    ).toBe(true)
    await expect(parent.handle).resolves.toEqual({ status: 'resolved', value: { saved: true } })
  })

  it('closing top의 반복 close가 아래 session으로 전달되지 않는다', async () => {
    const runtime = createOverlayRuntime()
    const lower = createConfirm(runtime, 'lower')
    const top = createConfirm(runtime, 'top')
    runtime.markOpen(lower.id)
    runtime.markOpen(top.id)

    expect(runtime.close()).toBe(true)
    expect(runtime.close()).toBe(false)
    expect(runtime.getSnapshot()[0]).toMatchObject({ id: lower.id, phase: 'open', open: true })

    runtime.completeClose(top.id)
    expect(runtime.close()).toBe(true)
    await expect(lower.handle).resolves.toBe(false)
  })

  it('handle.close가 top 여부와 관계없이 정확한 session을 닫는다', async () => {
    const runtime = createOverlayRuntime()
    const lower = createCustom(runtime, 'lower')
    const top = createCustom(runtime, 'top')
    runtime.markOpen(lower.id)
    runtime.markOpen(top.id)

    expect(lower.handle.close('route-change')).toBe(true)
    await expect(lower.handle).resolves.toEqual({ status: 'closed', reason: 'route-change' })
    expect(runtime.getSnapshot()).toMatchObject([
      { id: lower.id, phase: 'closing', open: false },
      { id: top.id, phase: 'open', open: true },
    ])

    expect(runtime.resolveSession(top.id, { status: 'resolved', value: undefined })).toBe(true)
    await expect(top.handle).resolves.toEqual({ status: 'resolved', value: undefined })
  })

  it('closeAll이 모든 session을 같은 reason으로 완료한다', async () => {
    const runtime = createOverlayRuntime()
    const alert = runtime.createSession({
      kind: 'alert',
      payload: { message: 'saved' },
      closeValue: () => undefined,
      closeOnEscape: false,
      closeOnOutsidePress: false,
    })
    const confirm = createConfirm(runtime, 'confirm')
    const custom = createCustom(runtime, 'custom')

    runtime.closeAll('route-change')

    await expect(alert.handle).resolves.toBeUndefined()
    await expect(confirm.handle).resolves.toBe(false)
    await expect(custom.handle).resolves.toEqual({ status: 'closed', reason: 'route-change' })
    expect(runtime.getSnapshot().every(({ phase }) => phase === 'closing')).toBe(true)

    for (const { id } of runtime.getSnapshot()) runtime.completeClose(id)
    expect(runtime.getSnapshot()).toEqual([])
  })

  it('custom resolve와 close를 서로 다른 OverlayOutcome으로 반환한다', async () => {
    const runtime = createOverlayRuntime()
    const resolved = createCustom<{ documentId: string }>(runtime, 'resolved')
    const closed = createCustom<{ documentId: string }>(runtime, 'closed')

    expect(
      runtime.resolveSession(resolved.id, {
        status: 'resolved',
        value: { documentId: 'document-1' },
      } satisfies OverlayOutcome<{ documentId: string }>),
    ).toBe(true)
    expect(closed.handle.close('cancel')).toBe(true)

    await expect(resolved.handle).resolves.toEqual({
      status: 'resolved',
      value: { documentId: 'document-1' },
    })
    await expect(closed.handle).resolves.toEqual({ status: 'closed', reason: 'cancel' })
  })

  it('requestClose는 topmost와 session close 정책을 모두 확인한다', async () => {
    const runtime = createOverlayRuntime()
    const lower = createCustom(runtime, 'lower')
    const guarded = createCustom(runtime, 'guarded', {
      closeOnEscape: false,
      closeOnOutsidePress: true,
    })
    runtime.markOpen(lower.id)
    runtime.markOpen(guarded.id)

    expect(runtime.requestClose(lower.id, 'outside')).toBe(false)
    expect(runtime.requestClose(guarded.id, 'escape')).toBe(false)
    expect(runtime.requestClose(guarded.id, 'outside')).toBe(true)
    await expect(guarded.handle).resolves.toEqual({ status: 'closed', reason: 'outside' })
  })

  it('settle된 session의 늦은 resolve와 close를 무시한다', async () => {
    const runtime = createOverlayRuntime()
    const session = createCustom<{ saved: true }>(runtime, 'late-result')

    expect(session.handle.close()).toBe(true)
    expect(
      runtime.resolveSession(session.id, {
        status: 'resolved',
        value: { saved: true },
      }),
    ).toBe(false)
    expect(session.handle.close()).toBe(false)
    await expect(session.handle).resolves.toEqual({ status: 'closed', reason: 'programmatic' })
  })

  it('completeClose 전에는 session을 stack에서 제거하지 않는다', () => {
    const runtime = createOverlayRuntime()
    const session = createConfirm(runtime, 'closing')

    runtime.completeClose(session.id)
    expect(runtime.getSnapshot()).toHaveLength(1)

    runtime.closeSession(session.id)
    expect(runtime.getSnapshot()).toHaveLength(1)
    expect(runtime.getSnapshot()[0]).toMatchObject({ phase: 'closing', open: false })

    runtime.completeClose(session.id)
    expect(runtime.getSnapshot()).toEqual([])
  })

  it('closing이 10초간 완료되지 않으면 session별 개발 경고를 출력한다', async () => {
    vi.useFakeTimers()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const runtime = createOverlayRuntime()
    const session = createConfirm(runtime, 'warning')

    runtime.closeSession(session.id)
    await vi.advanceTimersByTimeAsync(10_000)

    expect(warn).toHaveBeenCalledOnce()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('completeClose()'))
  })

  it('completeClose가 closing 경고를 취소한다', async () => {
    vi.useFakeTimers()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const runtime = createOverlayRuntime()
    const session = createConfirm(runtime, 'no-warning')

    runtime.closeSession(session.id)
    runtime.completeClose(session.id)
    await vi.advanceTimersByTimeAsync(10_000)

    expect(warn).not.toHaveBeenCalled()
  })

  it('production에서는 closing 경고를 출력하지 않는다', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.useFakeTimers()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const runtime = createOverlayRuntime()
    const session = createConfirm(runtime, 'production')

    runtime.closeSession(session.id)
    await vi.advanceTimersByTimeAsync(10_000)

    expect(warn).not.toHaveBeenCalled()
  })

  it('변경 사이에는 같은 snapshot을 유지하고 구독 해제를 존중한다', () => {
    const runtime = createOverlayRuntime()
    const listener = vi.fn()
    const unsubscribe = runtime.subscribe(listener)
    const initial = runtime.getSnapshot()

    expect(runtime.getSnapshot()).toBe(initial)
    const session = createConfirm(runtime, 'subscription')
    const opening = runtime.getSnapshot()
    expect(opening).not.toBe(initial)
    expect(runtime.getSnapshot()).toBe(opening)
    expect(listener).toHaveBeenCalledOnce()

    unsubscribe()
    runtime.markOpen(session.id)
    expect(listener).toHaveBeenCalledOnce()
  })

  it('dispose가 남은 Promise와 closing timer를 정리한다', async () => {
    vi.useFakeTimers()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const runtime = createOverlayRuntime()
    const custom = createCustom(runtime, 'custom')
    const confirm = createConfirm(runtime, 'confirm')
    runtime.closeSession(confirm.id)

    runtime.dispose('route-change')

    await expect(custom.handle).resolves.toEqual({ status: 'closed', reason: 'route-change' })
    await expect(confirm.handle).resolves.toBe(false)
    expect(runtime.getSnapshot()).toEqual([])
    await vi.advanceTimersByTimeAsync(10_000)
    expect(warn).not.toHaveBeenCalled()
  })

  it('서로 다른 runtime의 stack과 close는 격리된다', async () => {
    const firstRuntime = createOverlayRuntime()
    const secondRuntime = createOverlayRuntime()
    const first = createConfirm(firstRuntime, 'first')
    const second = createConfirm(secondRuntime, 'second')

    expect(firstRuntime.close()).toBe(true)
    await expect(first.handle).resolves.toBe(false)
    expect(secondRuntime.getSnapshot()).toMatchObject([{ id: second.id, phase: 'opening' }])

    let secondSettled = false
    void second.handle.then(() => {
      secondSettled = true
    })
    await Promise.resolve()
    expect(secondSettled).toBe(false)
  })
})

describe('RFC 0004 recipe runtime contract', () => {
  it.todo('Alert action이 동기 onAction을 실행하고 programmatic close는 실행하지 않는다')
  it.todo('Confirm이 pending, error와 같은 onConfirm 재시도를 관리한다')
})
