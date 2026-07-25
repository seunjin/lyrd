import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  type AlertSessionPayload,
  type ConfirmSessionPayload,
  createScopedOverlayClient,
  getScopedClientInternals,
} from './client'
import type { AlertRendererProps, ConfirmRendererProps } from './contract'
import { createAlertRendererProps, createConfirmRendererProps } from './recipes'
import type { OverlayRuntime, OverlayRuntimeSessionSnapshot } from './runtime'

type TestRequests = {
  alert: {
    message: string
  }
  confirm: {
    heading: string
    onCancel?: () => void
  }
}

function createTestClient() {
  const client = createScopedOverlayClient<TestRequests>({})
  return { client, runtime: getScopedClientInternals(client).runtime }
}

function getAlertProps(runtime: OverlayRuntime): AlertRendererProps<TestRequests['alert']> {
  const snapshot = runtime
    .getSnapshot()
    .find(({ kind }) => kind === 'alert') as OverlayRuntimeSessionSnapshot<
    'alert',
    AlertSessionPayload<TestRequests['alert']>
  >
  return createAlertRendererProps(runtime, snapshot)
}

function getConfirmProps(runtime: OverlayRuntime): ConfirmRendererProps<TestRequests['confirm']> {
  const snapshot = runtime
    .getSnapshot()
    .find(({ kind }) => kind === 'confirm') as OverlayRuntimeSessionSnapshot<
    'confirm',
    ConfirmSessionPayload<TestRequests['confirm']>
  >
  return createConfirmRendererProps(runtime, snapshot)
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('Alert recipe', () => {
  it('action이 동기 onAction을 한 번 실행하고 void로 완료한다', async () => {
    const { client, runtime } = createTestClient()
    const onAction = vi.fn()
    const handle = client.alert({ message: '저장했습니다', onAction })
    const props = getAlertProps(runtime)

    expect(props.request).toEqual({ message: '저장했습니다' })
    expect(props.request).not.toHaveProperty('onAction')

    props.action()
    props.action()

    expect(onAction).toHaveBeenCalledOnce()
    await expect(handle).resolves.toBeUndefined()
    expect(runtime.getSnapshot()[0]).toMatchObject({ open: false, phase: 'closing' })
  })

  it('onAction이 없어도 action으로 닫고 programmatic close는 onAction을 실행하지 않는다', async () => {
    const { client, runtime } = createTestClient()
    const onAction = vi.fn()
    const actionHandle = client.alert({ message: '확인' })
    const actionProps = getAlertProps(runtime)

    actionProps.action()
    await expect(actionHandle).resolves.toBeUndefined()
    actionProps.completeClose()

    const closedHandle = client.alert({ message: '닫기', onAction })
    expect(closedHandle.close()).toBe(true)

    await expect(closedHandle).resolves.toBeUndefined()
    expect(onAction).not.toHaveBeenCalled()
  })

  it('onAction이 예외를 던져도 Alert를 닫은 뒤 같은 예외를 다시 던진다', async () => {
    const { client, runtime } = createTestClient()
    const error = new Error('action failed')
    const handle = client.alert({
      message: '실패',
      onAction: () => {
        throw error
      },
    })

    expect(() => getAlertProps(runtime).action()).toThrow(error)
    await expect(handle).resolves.toBeUndefined()
    expect(runtime.getSnapshot()[0]).toMatchObject({ phase: 'closing' })
  })

  it('thenable onAction을 기다리지 않고 닫으며 개발 환경에서 사용법을 경고한다', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const { client, runtime } = createTestClient()
    let finishAction!: () => void
    const task = new Promise<void>((resolve) => {
      finishAction = resolve
    })
    const handle = client.alert({ message: '비동기', onAction: () => task })

    getAlertProps(runtime).action()

    await expect(handle).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('confirm 또는 open'))
    finishAction()
  })
})

describe('Confirm recipe', () => {
  it('onConfirm이 없거나 동기적으로 완료되면 true로 완료한다', async () => {
    const withoutAction = createTestClient()
    const plainHandle = withoutAction.client.confirm({ heading: '계속할까요?' })
    withoutAction.runtime.markOpen(withoutAction.runtime.getSnapshot()[0]?.id ?? -1)
    getConfirmProps(withoutAction.runtime).confirm()
    await expect(plainHandle).resolves.toBe(true)

    const withAction = createTestClient()
    const onConfirm = vi.fn()
    const actionHandle = withAction.client.confirm({ heading: '삭제할까요?', onConfirm })
    getConfirmProps(withAction.runtime).confirm()

    expect(onConfirm).toHaveBeenCalledOnce()
    await expect(actionHandle).resolves.toBe(true)
  })

  it('동기 예외를 error로 표시하고 같은 작업을 다시 시도할 수 있다', async () => {
    const { client, runtime } = createTestClient()
    const error = new Error('첫 시도 실패')
    const onConfirm = vi.fn<() => void>()
    onConfirm.mockImplementationOnce(() => {
      throw error
    })
    const handle = client.confirm({ heading: '재시도', onConfirm })

    getConfirmProps(runtime).confirm()

    expect(getConfirmProps(runtime)).toMatchObject({ actionStatus: 'error', error })
    expect(runtime.getSnapshot()[0]).toMatchObject({ phase: 'opening' })

    getConfirmProps(runtime).confirm()

    expect(onConfirm).toHaveBeenCalledTimes(2)
    await expect(handle).resolves.toBe(true)
  })

  it('비동기 작업 중 중복 confirm, cancel, Escape와 outside close를 막는다', async () => {
    const { client, runtime } = createTestClient()
    let resolveAction!: () => void
    const task = new Promise<void>((resolve) => {
      resolveAction = resolve
    })
    const onConfirm = vi.fn(() => task)
    const handle = client.confirm({ heading: '저장', onConfirm })
    runtime.markOpen(runtime.getSnapshot()[0]?.id ?? -1)
    const initialProps = getConfirmProps(runtime)

    initialProps.confirm()
    initialProps.confirm()
    initialProps.cancel()
    initialProps.requestClose('escape')
    initialProps.requestClose('outside')

    expect(onConfirm).toHaveBeenCalledOnce()
    expect(getConfirmProps(runtime)).toMatchObject({ actionStatus: 'pending', error: null })
    expect(runtime.getSnapshot()[0]).toMatchObject({ open: true, phase: 'open' })

    resolveAction()
    await expect(handle).resolves.toBe(true)
  })

  it('비동기 실패를 표시하고 재시도 성공을 처리한다', async () => {
    const { client, runtime } = createTestClient()
    const error = new Error('서버 실패')
    const onConfirm = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(undefined)
    const handle = client.confirm({ heading: '다시 저장', onConfirm })

    getConfirmProps(runtime).confirm()
    await Promise.resolve()
    await Promise.resolve()

    expect(getConfirmProps(runtime)).toMatchObject({ actionStatus: 'error', error })

    getConfirmProps(runtime).confirm()
    await expect(handle).resolves.toBe(true)
    expect(onConfirm).toHaveBeenCalledTimes(2)
  })

  it('pending 중 명시적 close는 false로 완료하고 늦은 작업 결과를 무시한다', async () => {
    const { client, runtime } = createTestClient()
    let resolveAction!: () => void
    const task = new Promise<void>((resolve) => {
      resolveAction = resolve
    })
    const handle = client.confirm({ heading: '닫기', onConfirm: () => task })

    getConfirmProps(runtime).confirm()
    expect(handle.close('route-change')).toBe(true)
    await expect(handle).resolves.toBe(false)

    resolveAction()
    await Promise.resolve()
    expect(runtime.getSnapshot()[0]).toMatchObject({ phase: 'closing' })
    expect(getConfirmProps(runtime).actionStatus).toBe('pending')
  })

  it('cancel은 false를 반환하고 앱의 onCancel 필드를 자동 실행하지 않는다', async () => {
    const { client, runtime } = createTestClient()
    const onCancel = vi.fn()
    const handle = client.confirm({ heading: '취소', onCancel })
    const props = getConfirmProps(runtime)

    expect(props.request.onCancel).toBe(onCancel)
    props.cancel()

    await expect(handle).resolves.toBe(false)
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('Escape와 outside 정책을 적용하며 허용된 request close는 false를 반환한다', async () => {
    const { client, runtime } = createTestClient()
    const guarded = client.confirm({
      heading: '보호됨',
      closeOnEscape: false,
      closeOnOutsidePress: true,
    })
    const sessionId = runtime.getSnapshot()[0]?.id ?? -1
    runtime.markOpen(sessionId)
    const props = getConfirmProps(runtime)

    props.requestClose('escape')
    expect(runtime.getSnapshot()[0]).toMatchObject({ open: true, phase: 'open' })

    props.requestClose('outside')
    await expect(guarded).resolves.toBe(false)
    expect(runtime.getSnapshot()[0]).toMatchObject({ open: false, phase: 'closing' })
  })
})
