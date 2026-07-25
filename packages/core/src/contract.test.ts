import type { ComponentProps, ComponentType, ReactElement, ReactNode } from 'react'
import { describe, expectTypeOf, it } from 'vitest'
import type {
  AlertRendererProps,
  AlertRequest,
  ConfirmRendererProps,
  ConfirmRequest,
  CreateOverlayScope,
  OverlayClient,
  OverlayHandle,
  OverlayOutcome,
  OverlayPhase,
  OverlayRenderers,
  OverlayScope,
  OverlaySession,
} from './contract'

type AppAlertFields = {
  message: ReactNode
  actionLabel?: ReactNode
}

type AppConfirmFields = (
  | {
      heading: ReactNode
      tone?: 'neutral'
      primaryAction?: ReactNode
    }
  | {
      heading: ReactNode
      tone: 'danger'
      primaryAction: ReactNode
    }
) & {
  onCancel?: () => void
}

type AppRequests = {
  alert: AppAlertFields
  confirm: AppConfirmFields
}

type AppClient = OverlayClient<AppRequests>

declare const createOverlayScope: CreateOverlayScope
declare const element: ReactElement

function assertValidCalls(client: AppClient) {
  const alert = client.alert({
    message: '저장했습니다.',
    onAction: () => undefined,
  })
  expectTypeOf(alert).toEqualTypeOf<OverlayHandle<void>>()

  const confirm = client.confirm({
    heading: '삭제할까요?',
    tone: 'danger',
    primaryAction: '삭제',
    onConfirm: async () => undefined,
  })
  expectTypeOf(confirm).toEqualTypeOf<OverlayHandle<boolean>>()

  const custom = client.open<{ documentId: string }>(element, {
    closeOnEscape: false,
    closeOnOutsidePress: false,
  })
  expectTypeOf(custom).toEqualTypeOf<OverlayHandle<OverlayOutcome<{ documentId: string }>>>()

  expectTypeOf(client.open(element)).toEqualTypeOf<OverlayHandle<OverlayOutcome<void>>>()
  expectTypeOf(client.close()).toEqualTypeOf<boolean>()
  expectTypeOf(client.closeAll('route-change')).toEqualTypeOf<void>()

  // @ts-expect-error 앱이 선언하지 않은 Alert 표시 필드는 받을 수 없다.
  client.alert({ message: '저장했습니다.', tone: 'success' })

  // @ts-expect-error danger Confirm은 앱 계약상 primaryAction이 필요하다.
  client.confirm({ heading: '삭제할까요?', tone: 'danger' })

  // @ts-expect-error custom open에는 별도의 input 인자를 받지 않는다.
  client.open(element, { projectId: 'project-1' })

  // @ts-expect-error open의 제네릭은 Result 하나만 받는다.
  client.open<{ saved: true }, { projectId: string }>(element)

  // @ts-expect-error 새 Handle은 활성 session input을 갱신하지 않는다.
  custom.update({ documentId: 'document-2' })

  // @ts-expect-error 닫힘 outcome 이름은 dismissed가 아니라 closed다.
  const _legacyOutcome: OverlayOutcome<void> = { status: 'dismissed', reason: 'cancel' }
}

function assertScopeContract() {
  const scope = createOverlayScope<AppRequests>()

  expectTypeOf(scope).toEqualTypeOf<OverlayScope<AppRequests>>()
  expectTypeOf<ReturnType<typeof scope.useOverlay>>().toEqualTypeOf<AppClient>()
  expectTypeOf(scope.createClient()).toEqualTypeOf<AppClient>()
  expectTypeOf<ComponentProps<typeof scope.OverlayProvider>>().toEqualTypeOf<{
    children?: ReactNode
    client?: AppClient
    renderers: OverlayRenderers<AppRequests>
  }>()

  // @ts-expect-error onAction은 Alert Core가 예약한 behavior 필드다.
  createOverlayScope<{
    alert: AppAlertFields & { onAction?: () => void }
    confirm: AppConfirmFields
  }>()

  // @ts-expect-error onConfirm과 close 정책은 Confirm Core 예약 필드다.
  createOverlayScope<{
    alert: AppAlertFields
    confirm: AppConfirmFields & {
      onConfirm?: () => Promise<void>
      closeOnEscape?: boolean
    }
  }>()
}

function assertRendererContract(
  alert: AlertRendererProps<AppAlertFields>,
  confirm: ConfirmRendererProps<AppConfirmFields>,
) {
  expectTypeOf(alert.request).toEqualTypeOf<AppAlertFields>()
  expectTypeOf(alert.phase).toEqualTypeOf<OverlayPhase>()
  expectTypeOf(alert.action()).toEqualTypeOf<void>()
  expectTypeOf(alert.completeClose()).toEqualTypeOf<void>()

  expectTypeOf(confirm.request).toEqualTypeOf<AppConfirmFields>()
  expectTypeOf(confirm.request.onCancel).toEqualTypeOf<(() => void) | undefined>()
  expectTypeOf(confirm.actionStatus).toEqualTypeOf<'idle' | 'pending' | 'error'>()
  expectTypeOf(confirm.confirm()).toEqualTypeOf<void>()
  expectTypeOf(confirm.cancel()).toEqualTypeOf<void>()
  expectTypeOf(confirm.requestClose('escape')).toEqualTypeOf<void>()

  // @ts-expect-error Renderer request에는 예약 onAction callback이 노출되지 않는다.
  alert.request.onAction

  // @ts-expect-error Renderer request에는 예약 onConfirm callback이 노출되지 않는다.
  confirm.request.onConfirm

  // @ts-expect-error Renderer request에는 예약 close 정책이 노출되지 않는다.
  confirm.request.closeOnOutsidePress
}

function assertSessionContract(session: OverlaySession<{ saved: true }>) {
  expectTypeOf(session.open).toEqualTypeOf<boolean>()
  expectTypeOf(session.phase).toEqualTypeOf<OverlayPhase>()
  expectTypeOf(session.resolve({ saved: true })).toEqualTypeOf<boolean>()
  expectTypeOf(session.close('cancel')).toEqualTypeOf<boolean>()
  expectTypeOf(session.requestClose('outside')).toEqualTypeOf<boolean>()
  expectTypeOf(session.completeClose()).toEqualTypeOf<void>()

  // @ts-expect-error requestClose는 UI primitive의 escape/outside 요청만 받는다.
  session.requestClose('programmatic')
}

describe('RFC 0004 public type contract', () => {
  it('앱 request, client, renderer와 session 타입을 연결한다', () => {
    expectTypeOf<Parameters<AppClient['alert']>[0]>().toEqualTypeOf<AlertRequest<AppAlertFields>>()
    expectTypeOf<Parameters<AppClient['confirm']>[0]>().toEqualTypeOf<
      ConfirmRequest<AppConfirmFields>
    >()
    expectTypeOf<OverlayRenderers<AppRequests>>().toEqualTypeOf<{
      alert: ComponentType<AlertRendererProps<AppAlertFields>>
      confirm: ComponentType<ConfirmRendererProps<AppConfirmFields>>
    }>()
  })
})

void assertValidCalls
void assertScopeContract
void assertRendererContract
void assertSessionContract
