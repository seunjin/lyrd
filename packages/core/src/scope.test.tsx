import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it } from 'vitest'
import { type CustomSessionPayload, getScopedClientInternals } from './client'
import type {
  AlertRendererProps,
  ConfirmRendererProps,
  OverlayClient,
  OverlayRenderers,
  OverlaySession,
} from './contract'
import { createOverlayScope, retainOverlayRuntime, useOverlaySession } from './scope'

type AppRequests = {
  alert: {
    message: ReactNode
    actionLabel?: ReactNode
  }
  confirm: {
    heading: ReactNode
    primaryAction?: ReactNode
  }
}

const appOverlay = createOverlayScope<AppRequests>()
const Provider = appOverlay.OverlayProvider
const capturedSessions = new Map<string, OverlaySession<unknown>>()
let capturedClient: OverlayClient<AppRequests> | null = null

const renderers: OverlayRenderers<AppRequests> = {
  alert: () => null,
  confirm: () => null,
}

function SessionProbe({ label, name }: { label: string; name: string }) {
  const session = useOverlaySession<unknown>()
  capturedSessions.set(name, session)

  return (
    <div data-name={name} data-open={session.open} data-phase={session.phase}>
      {label}
    </div>
  )
}

function ClientProbe() {
  capturedClient = appOverlay.useOverlay()
  return null
}

function renderProvider(client: OverlayClient<AppRequests>) {
  return renderToStaticMarkup(
    <Provider client={client} renderers={renderers}>
      <ClientProbe />
    </Provider>,
  )
}

beforeEach(() => {
  capturedSessions.clear()
  capturedClient = null
})

describe('createOverlayScope custom session', () => {
  it('Alert와 Confirm renderer를 custom session과 같은 stack 순서로 렌더한다', async () => {
    const client = appOverlay.createClient()
    const { runtime } = getScopedClientInternals(client)
    let alertProps: AlertRendererProps<AppRequests['alert']> | undefined
    let confirmProps: ConfirmRendererProps<AppRequests['confirm']> | undefined
    const recipeRenderers: OverlayRenderers<AppRequests> = {
      alert: (props) => {
        alertProps = props
        return <div>Alert: {props.request.message}</div>
      },
      confirm: (props) => {
        confirmProps = props
        return <div>Confirm: {props.request.heading}</div>
      },
    }
    const alertHandle = client.alert({ message: '저장됨', onAction: () => undefined })
    const confirmHandle = client.confirm({ heading: '삭제할까요?', onConfirm: () => undefined })
    const customHandle = client.open(<SessionProbe label="직접 구성" name="custom" />)

    for (const { id } of runtime.getSnapshot()) runtime.markOpen(id)
    const markup = renderToStaticMarkup(<Provider client={client} renderers={recipeRenderers} />)

    expect(markup.indexOf('Alert: 저장됨')).toBeLessThan(markup.indexOf('Confirm: 삭제할까요?'))
    expect(markup.indexOf('Confirm: 삭제할까요?')).toBeLessThan(markup.indexOf('직접 구성'))
    expect(alertProps?.request).toEqual({ message: '저장됨' })
    expect(confirmProps?.request).toEqual({ heading: '삭제할까요?' })

    alertProps?.action()
    confirmProps?.confirm()
    capturedSessions.get('custom')?.close()

    await expect(alertHandle).resolves.toBeUndefined()
    await expect(confirmHandle).resolves.toBe(true)
    await expect(customHandle).resolves.toEqual({ status: 'closed', reason: 'programmatic' })
  })

  it('JSX element를 snapshot으로 보관하고 OverlayOutcome을 반환한다', async () => {
    const client = appOverlay.createClient()
    const { runtime } = getScopedClientInternals(client)
    const element = <SessionProbe label="초기 이름" name="editor" />
    const handle = client.open<{ documentId: string }>(element)

    const opening = runtime.getSnapshot()[0]
    expect(opening).toMatchObject({ kind: 'custom', open: false, phase: 'opening' })
    expect((opening?.payload as CustomSessionPayload).element).toBe(element)

    expect(runtime.markOpen(opening?.id ?? -1)).toBe(true)
    const openMarkup = renderProvider(client)
    expect(openMarkup).toContain('data-open="true"')
    expect(openMarkup).toContain('data-phase="open"')
    expect(openMarkup).toContain('초기 이름')
    expect(capturedClient).toBe(client)

    const session = capturedSessions.get('editor')
    expect(session?.resolve({ documentId: 'document-1' })).toBe(true)
    await expect(handle).resolves.toEqual({
      status: 'resolved',
      value: { documentId: 'document-1' },
    })

    const closing = runtime.getSnapshot()[0]
    expect(closing).toMatchObject({ open: false, phase: 'closing' })
    expect((closing?.payload as CustomSessionPayload).element).toBe(element)

    renderProvider(client)
    capturedSessions.get('editor')?.completeClose()
    expect(runtime.getSnapshot()).toEqual([])
  })

  it('중첩된 element마다 독립 session context를 제공한다', async () => {
    const client = appOverlay.createClient()
    const { runtime } = getScopedClientInternals(client)
    const lower = client.open<string>(<SessionProbe label="아래" name="lower" />)
    const top = client.open<string>(<SessionProbe label="위" name="top" />)

    for (const { id } of runtime.getSnapshot()) runtime.markOpen(id)
    const markup = renderProvider(client)
    expect(markup).toContain('아래')
    expect(markup).toContain('위')

    expect(capturedSessions.get('lower')?.close('cancel')).toBe(true)
    await expect(lower).resolves.toEqual({ status: 'closed', reason: 'cancel' })
    expect(runtime.getSnapshot()).toMatchObject([
      { phase: 'closing', open: false },
      { phase: 'open', open: true },
    ])

    let topSettled = false
    void top.then(() => {
      topSettled = true
    })
    await Promise.resolve()
    expect(topSettled).toBe(false)

    expect(capturedSessions.get('top')?.resolve('완료')).toBe(true)
    await expect(top).resolves.toEqual({ status: 'resolved', value: '완료' })
  })

  it('custom session의 requestClose를 topmost 정책에 연결한다', async () => {
    const client = appOverlay.createClient()
    const { runtime } = getScopedClientInternals(client)
    const handle = client.open(<SessionProbe label="보호됨" name="guarded" />, {
      closeOnEscape: false,
      closeOnOutsidePress: true,
    })

    const snapshot = runtime.getSnapshot()[0]
    runtime.markOpen(snapshot?.id ?? -1)
    renderProvider(client)

    expect(capturedSessions.get('guarded')?.requestClose('escape')).toBe(false)
    expect(capturedSessions.get('guarded')?.requestClose('outside')).toBe(true)
    await expect(handle).resolves.toEqual({ status: 'closed', reason: 'outside' })
  })

  it('client의 closeAll로 route cleanup 결과를 확정한다', async () => {
    const client = appOverlay.createClient()
    const { runtime } = getScopedClientInternals(client)
    const first = client.open(<SessionProbe label="첫 번째" name="first" />)
    const second = client.open(<SessionProbe label="두 번째" name="second" />)

    client.closeAll('route-change')

    await expect(first).resolves.toEqual({ status: 'closed', reason: 'route-change' })
    await expect(second).resolves.toEqual({ status: 'closed', reason: 'route-change' })
    expect(runtime.getSnapshot().every(({ phase }) => phase === 'closing')).toBe(true)
  })

  it('다른 scope에서 만든 client 주입을 거부한다', () => {
    const otherScope = createOverlayScope<AppRequests>()
    const otherClient = otherScope.createClient()

    expect(() =>
      renderToStaticMarkup(
        <Provider client={otherClient} renderers={renderers}>
          <span>child</span>
        </Provider>,
      ),
    ).toThrow('같은 createOverlayScope()')
  })

  it('SSR에서 browser global 없이 Provider와 custom element를 렌더링한다', () => {
    const client = appOverlay.createClient()
    const { runtime } = getScopedClientInternals(client)
    client.open(<SessionProbe label="서버 렌더" name="ssr" />)
    const snapshot = runtime.getSnapshot()[0]
    runtime.markOpen(snapshot?.id ?? -1)

    expect(renderProvider(client)).toContain('서버 렌더')
  })

  it('Provider cleanup이 unresolved Promise와 session을 정리한다', async () => {
    const client = appOverlay.createClient()
    const { runtime } = getScopedClientInternals(client)
    const handle = client.open(<SessionProbe label="정리" name="cleanup" />)
    const release = retainOverlayRuntime(runtime)

    release()
    await Promise.resolve()

    await expect(handle).resolves.toEqual({ status: 'closed', reason: 'programmatic' })
    expect(runtime.getSnapshot()).toEqual([])
  })

  it('Strict Mode effect 재실행 사이에는 session을 유지한다', async () => {
    const client = appOverlay.createClient()
    const { runtime } = getScopedClientInternals(client)
    const handle = client.open(<SessionProbe label="유지" name="strict-mode" />)
    const firstRelease = retainOverlayRuntime(runtime)

    firstRelease()
    const finalRelease = retainOverlayRuntime(runtime)
    await Promise.resolve()

    let settled = false
    void handle.then(() => {
      settled = true
    })
    await Promise.resolve()
    expect(settled).toBe(false)
    expect(runtime.getSnapshot()).toHaveLength(1)

    finalRelease()
    await Promise.resolve()
    await expect(handle).resolves.toEqual({ status: 'closed', reason: 'programmatic' })
  })

  it('open 밖에서 useOverlaySession을 호출하면 사용 위치를 설명한다', () => {
    expect(() => renderToStaticMarkup(<SessionProbe label="잘못된 위치" name="outside" />)).toThrow(
      'overlay.open()으로 열린 컴포넌트',
    )
  })
})
