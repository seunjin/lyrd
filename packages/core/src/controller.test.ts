import { type ComponentType, createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createOverlayController } from './controller'
import { OverlayProvider, type OverlayProviderProps, useOverlayDialog } from './provider'

async function flushPromises() {
  for (let index = 0; index < 5; index++) {
    await Promise.resolve()
  }
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('overlay confirm controller', () => {
  it('closing이 10초간 완료되지 않으면 개발 모드 경고를 한 번 출력한다', async () => {
    vi.useFakeTimers()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const controller = createOverlayController()

    const result = controller.overlay.confirm({ title: '제목', confirmLabel: '확인' })
    controller.openCurrent()
    controller.confirmCurrent()
    await expect(result).resolves.toBe(true)

    await vi.advanceTimersByTimeAsync(10_000)

    expect(warn).toHaveBeenCalledOnce()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('completeExit()'))
  })

  it('closing 완료 시 개발 모드 경고를 취소한다', async () => {
    vi.useFakeTimers()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const controller = createOverlayController()

    const result = controller.overlay.confirm({ title: '제목', confirmLabel: '확인' })
    controller.openCurrent()
    controller.confirmCurrent()
    await expect(result).resolves.toBe(true)
    controller.completeExit()

    await vi.advanceTimersByTimeAsync(10_000)

    expect(warn).not.toHaveBeenCalled()
  })

  it('production에서는 closing 경고를 출력하지 않는다', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.useFakeTimers()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const controller = createOverlayController()

    const result = controller.overlay.confirm({ title: '제목', confirmLabel: '확인' })
    controller.openCurrent()
    controller.confirmCurrent()
    await expect(result).resolves.toBe(true)
    await vi.advanceTimersByTimeAsync(10_000)

    expect(warn).not.toHaveBeenCalled()
  })
  it('확인하면 true를 반환하고 닫힘 상태로 전환한다', async () => {
    const controller = createOverlayController()
    const result = controller.overlay.confirm({ title: '제목', confirmLabel: '확인' })

    expect(controller.getSnapshot()).toMatchObject({ open: false, status: 'mounting' })
    controller.confirmCurrent()
    expect(controller.getSnapshot()).toMatchObject({ open: false, status: 'mounting' })

    controller.openCurrent()
    expect(controller.getSnapshot()).toMatchObject({ open: true, status: 'open' })
    controller.confirmCurrent()

    await expect(result).resolves.toBe(true)
    expect(controller.getSnapshot().status).toBe('closing')
    expect(controller.getSnapshot().open).toBe(false)
  })

  it('취소하면 false를 반환한다', async () => {
    const controller = createOverlayController()
    const result = controller.overlay.confirm({ title: '제목', confirmLabel: '확인' })

    controller.openCurrent()
    controller.cancelCurrent()

    await expect(result).resolves.toBe(false)
  })

  it('요청을 순서대로 보여준다', async () => {
    const controller = createOverlayController()
    const first = controller.overlay.confirm({ title: '첫 번째', confirmLabel: '확인' })
    const second = controller.overlay.confirm({ title: '두 번째', confirmLabel: '확인' })

    expect(controller.getSnapshot().request?.title).toBe('첫 번째')
    controller.openCurrent()
    controller.confirmCurrent()
    await expect(first).resolves.toBe(true)

    controller.completeExit()
    expect(controller.getSnapshot().request?.title).toBe('두 번째')
    expect(controller.getSnapshot()).toMatchObject({ open: false, status: 'mounting' })
    controller.openCurrent()
    controller.cancelCurrent()
    await expect(second).resolves.toBe(false)
  })

  it('같은 dedupeKey 요청은 동일한 Promise를 공유한다', async () => {
    const controller = createOverlayController()
    const first = controller.overlay.confirm({
      title: '첫 번째',
      confirmLabel: '확인',
      dedupeKey: 'delete-project',
    })
    const duplicate = controller.overlay.confirm({
      title: '중복',
      confirmLabel: '확인',
      dedupeKey: 'delete-project',
    })

    expect(duplicate).toBe(first)
    expect(controller.getSnapshot().request?.title).toBe('첫 번째')

    controller.openCurrent()
    controller.confirmCurrent()
    await expect(duplicate).resolves.toBe(true)
  })

  it('비동기 onConfirm 동안 pending 상태가 되고 완료 후 닫힌다', async () => {
    const controller = createOverlayController()
    let complete!: () => void
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          complete = resolve
        }),
    )
    const result = controller.overlay.confirm({ title: '제목', confirmLabel: '확인', onConfirm })

    controller.openCurrent()
    controller.confirmCurrent()
    await flushPromises()
    expect(controller.getSnapshot().status).toBe('pending')

    complete()
    await flushPromises()
    await expect(result).resolves.toBe(true)
    expect(controller.getSnapshot().status).toBe('closing')
  })

  it('비동기 실패 시 오류 상태를 제공하고 같은 작업을 재시도한다', async () => {
    const controller = createOverlayController()
    const error = new Error('서버 오류')
    const onConfirm = vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce(undefined)
    const result = controller.overlay.confirm({ title: '제목', confirmLabel: '확인', onConfirm })

    controller.openCurrent()
    controller.confirmCurrent()
    await flushPromises()
    expect(controller.getSnapshot()).toMatchObject({ status: 'error', error, open: true })

    controller.confirmCurrent()
    await flushPromises()
    await expect(result).resolves.toBe(true)
    expect(onConfirm).toHaveBeenCalledTimes(2)
  })

  it('pending 중에는 닫기와 취소를 차단한다', async () => {
    const controller = createOverlayController()
    const onConfirm = () => new Promise<void>(() => {})
    const result = controller.overlay.confirm({ title: '제목', confirmLabel: '확인', onConfirm })

    controller.openCurrent()
    controller.confirmCurrent()
    await flushPromises()
    controller.requestDismiss()
    controller.cancelCurrent()

    expect(controller.getSnapshot().status).toBe('pending')
    expect(controller.getSnapshot().open).toBe(true)
    expect(await Promise.race([result, Promise.resolve('unsettled')])).toBe('unsettled')
  })

  it('dismissPolicy block이면 외부 닫기 요청을 무시한다', () => {
    const controller = createOverlayController()
    controller.overlay.confirm({
      title: '제목',
      confirmLabel: '확인',
      dismissPolicy: 'block',
    })

    controller.openCurrent()
    controller.requestDismiss()

    expect(controller.getSnapshot().status).toBe('open')
  })
})

describe('overlay alert controller', () => {
  it('인지하면 Promise를 완료하고 닫힘 상태로 전환한다', async () => {
    const controller = createOverlayController()
    const result = controller.overlay.alert({ title: '저장이 완료되었습니다.' })

    expect(controller.getSnapshot()).toMatchObject({
      kind: 'alert',
      open: false,
      status: 'mounting',
    })

    controller.openCurrent()
    controller.acknowledgeCurrent()

    await expect(result).resolves.toBeUndefined()
    expect(controller.getSnapshot()).toMatchObject({ open: false, status: 'closing' })
  })

  it('alert와 confirm 요청을 하나의 대기열에서 순서대로 보여준다', async () => {
    const controller = createOverlayController()
    const alertResult = controller.overlay.alert({ title: '먼저 안내' })
    const confirmResult = controller.overlay.confirm({ title: '다음 확인', confirmLabel: '계속' })

    expect(controller.getSnapshot()).toMatchObject({ kind: 'alert' })
    controller.openCurrent()
    controller.acknowledgeCurrent()
    await expect(alertResult).resolves.toBeUndefined()

    controller.completeExit()
    expect(controller.getSnapshot()).toMatchObject({
      kind: 'confirm',
      open: false,
      status: 'mounting',
      request: { title: '다음 확인' },
    })

    controller.openCurrent()
    controller.cancelCurrent()
    await expect(confirmResult).resolves.toBe(false)
  })

  it('같은 dedupeKey의 alert 요청은 동일한 Promise를 공유한다', async () => {
    const controller = createOverlayController()
    const first = controller.overlay.alert({ title: '첫 번째', dedupeKey: 'saved' })
    const duplicate = controller.overlay.alert({ title: '중복', dedupeKey: 'saved' })

    expect(duplicate).toBe(first)
    expect(controller.getSnapshot().request?.title).toBe('첫 번째')

    controller.openCurrent()
    controller.requestDismiss()
    await expect(duplicate).resolves.toBeUndefined()
  })

  it('마운트 중 dismissAll 요청도 현재 항목과 대기열을 정리한다', async () => {
    const controller = createOverlayController()
    const current = controller.overlay.alert({ title: '현재 안내' })
    const queued = controller.overlay.confirm({ title: '다음 확인', confirmLabel: '확인' })

    controller.overlay.dismissAll()

    await expect(current).resolves.toBeUndefined()
    await expect(queued).resolves.toBe(false)
    expect(controller.getSnapshot()).toMatchObject({ open: false, status: 'closing' })

    controller.completeExit()
    expect(controller.getSnapshot()).toMatchObject({ kind: null, status: 'idle' })
  })
})

describe('overlay dialog controller', () => {
  it('마운트된 element는 Provider context에서 dialog 상태를 받는다', () => {
    const controller = createOverlayController()

    function DialogContent() {
      const dialog = useOverlayDialog<string>()
      return createElement('output', null, `${dialog.open}:${dialog.status}`)
    }

    controller.overlay.dialog<string>(createElement(DialogContent))

    const TestOverlayProvider = OverlayProvider as ComponentType<
      Omit<OverlayProviderProps, 'children'> & { children?: ReactNode }
    >
    const providerProps = {
      controller,
      renderers: {
        alert: () => null,
        confirm: () => null,
      },
    }
    const mountingMarkup = renderToStaticMarkup(
      createElement(TestOverlayProvider, providerProps, null),
    )

    expect(mountingMarkup).toContain('<output>false:mounting</output>')

    controller.openCurrent()
    const openMarkup = renderToStaticMarkup(createElement(TestOverlayProvider, providerProps, null))

    expect(openMarkup).toContain('<output>true:open</output>')
  })

  it('결과를 반환하고 닫힘 완료 뒤 다음 요청을 연다', async () => {
    const controller = createOverlayController()
    const result = controller.overlay.dialog<{ saved: true }>(createElement('div'))
    const next = controller.overlay.confirm({ title: '다음 확인', confirmLabel: '확인' })

    expect(controller.getSnapshot()).toMatchObject({
      kind: 'dialog',
      open: false,
      status: 'mounting',
    })
    controller.openCurrent()
    controller.resolveDialogCurrent({ saved: true })

    await expect(result).resolves.toEqual({ saved: true })
    expect(controller.getSnapshot()).toMatchObject({
      kind: 'dialog',
      open: false,
      status: 'closing',
    })

    controller.completeExit()
    expect(controller.getSnapshot()).toMatchObject({
      kind: 'confirm',
      open: false,
      status: 'mounting',
    })
    controller.openCurrent()
    controller.cancelCurrent()
    await expect(next).resolves.toBe(false)
  })

  it('같은 컴포넌트 타입과 key의 dialog도 독립 요청으로 대기한다', async () => {
    const controller = createOverlayController()
    function ProjectSettings() {
      return createElement('div')
    }

    const first = controller.overlay.dialog<{ saved: true }>(createElement(ProjectSettings))
    const second = controller.overlay.dialog<{ saved: true }>(createElement(ProjectSettings))

    expect(second).not.toBe(first)
    controller.openCurrent()
    controller.resolveDialogCurrent({ saved: true })
    await expect(first).resolves.toEqual({ saved: true })

    controller.completeExit()
    expect(controller.getSnapshot()).toMatchObject({
      kind: 'dialog',
      open: false,
      status: 'mounting',
    })
    controller.openCurrent()
    controller.resolveDialogCurrent({ saved: true })
    await expect(second).resolves.toEqual({ saved: true })
  })

  it('dismissPolicy block이면 닫힘 요청을 무시하고 dismiss는 취소 결과를 반환한다', async () => {
    const controller = createOverlayController()
    const result = controller.overlay.dialog(createElement('div'), { dismissPolicy: 'block' })

    controller.openCurrent()
    controller.requestDismiss()
    expect(controller.getSnapshot()).toMatchObject({ kind: 'dialog', open: true, status: 'open' })

    controller.dismissDialogCurrent()
    await expect(result).resolves.toBeUndefined()
  })
})
