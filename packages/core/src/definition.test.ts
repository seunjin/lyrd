import { type ComponentType, createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { createOverlayController } from './controller'
import { defineOverlay } from './definition'
import { defineOverlayGroup } from './group'
import { OverlayProvider, type OverlayProviderProps } from './provider'
import type { OverlayOpenOptions, OverlayOutcome } from './types'

type ProjectSettingsInput = {
  projectId: string
}

type ProjectSettingsResult = {
  saved: true
}

const projectSettings = defineOverlay<ProjectSettingsInput, ProjectSettingsResult>(
  ({ input, session }) =>
    createElement('output', null, `${input.projectId}:${session.open}:${session.status}`),
)

describe('overlay definition types', () => {
  it('definition의 input과 result를 open 호출까지 추론한다', () => {
    const controller = createOverlayController()
    const result = controller.overlay.open(projectSettings, { projectId: 'project-a' })

    expectTypeOf(result).toEqualTypeOf<Promise<OverlayOutcome<ProjectSettingsResult>>>()
  })

  it('definition의 input과 result를 upsert 호출까지 추론한다', () => {
    const controller = createOverlayController()
    const result = controller.overlay.upsert(projectSettings, 'project-a', {
      projectId: 'project-a',
    })

    expectTypeOf(result).toEqualTypeOf<Promise<OverlayOutcome<ProjectSettingsResult>>>()
  })

  it('definition의 session resolve에 선언한 result 타입을 연결한다', () => {
    defineOverlay<ProjectSettingsInput, ProjectSettingsResult>(({ session }) => {
      session.resolve({ saved: true })

      // @ts-expect-error saved는 true 리터럴이어야 한다.
      session.resolve({ saved: false })

      return null
    })
  })
})

describe('overlay parallel group', () => {
  const toastGroup = defineOverlayGroup({ strategy: 'parallel' })

  it('group 정책 객체를 불변으로 정의한다', () => {
    expect(toastGroup).toEqual({ strategy: 'parallel' })
    expect(Object.isFrozen(toastGroup)).toBe(true)
  })

  it('group은 defineOverlayGroup으로만 선언한다', () => {
    // @ts-expect-error ad-hoc strategy 객체는 명시적인 group 정의가 아니다.
    const options: OverlayOpenOptions = { group: { strategy: 'parallel' } }
    expect(options.group?.strategy).toBe('parallel')
  })

  it('지원하지 않는 runtime strategy를 거절한다', () => {
    expect(() => defineOverlayGroup({ strategy: 'queue' } as never)).toThrow(
      '지원하지 않는 overlay group strategy입니다: queue',
    )
  })

  it('같은 group의 definition을 queue 없이 동시에 활성화한다', async () => {
    const controller = createOverlayController()
    const first = controller.overlay.open(
      projectSettings,
      { projectId: 'toast-a' },
      { group: toastGroup },
    )
    const second = controller.overlay.open(
      projectSettings,
      { projectId: 'toast-b' },
      { group: toastGroup },
    )
    const [firstSnapshot, secondSnapshot] = controller.getParallelSnapshots()
    if (!firstSnapshot || !secondSnapshot) throw new Error('parallel snapshot이 필요합니다.')

    expect(controller.getSnapshot()).toMatchObject({ kind: null, status: 'idle' })
    expect(controller.getParallelSnapshots()).toHaveLength(2)
    expect(firstSnapshot).toMatchObject({ input: { projectId: 'toast-a' }, status: 'mounting' })
    expect(secondSnapshot).toMatchObject({ input: { projectId: 'toast-b' }, status: 'mounting' })

    controller.openDefinition(firstSnapshot.sessionId)
    controller.openDefinition(secondSnapshot.sessionId)
    expect(controller.getParallelSnapshots().map(({ status }) => status)).toEqual(['open', 'open'])

    controller.resolveDefinition(firstSnapshot.sessionId, { saved: true })
    await expect(first).resolves.toEqual({ status: 'resolved', value: { saved: true } })
    expect(controller.getParallelSnapshots()).toMatchObject([
      { sessionId: firstSnapshot.sessionId, status: 'closing', open: false },
      { sessionId: secondSnapshot.sessionId, status: 'open', open: true },
    ])

    controller.completeDefinitionClose(firstSnapshot.sessionId)
    expect(controller.getParallelSnapshots()).toMatchObject([
      { sessionId: secondSnapshot.sessionId, status: 'open' },
    ])

    controller.dismissDefinition(secondSnapshot.sessionId, 'cancel')
    await expect(second).resolves.toEqual({ status: 'dismissed', reason: 'cancel' })
  })

  it('parallel group은 기존 modal queue와 독립적으로 열린다', () => {
    const controller = createOverlayController()
    controller.overlay.alert({ title: 'modal queue' })
    controller.overlay.open(projectSettings, { projectId: 'toast-a' }, { group: toastGroup })

    expect(controller.getSnapshot()).toMatchObject({ kind: 'alert', status: 'mounting' })
    expect(controller.getParallelSnapshots()).toMatchObject([
      { input: { projectId: 'toast-a' }, status: 'mounting' },
    ])
  })

  it('Provider가 여러 parallel definition session을 함께 렌더링한다', () => {
    const controller = createOverlayController()
    controller.overlay.open(projectSettings, { projectId: 'toast-a' }, { group: toastGroup })
    controller.overlay.open(projectSettings, { projectId: 'toast-b' }, { group: toastGroup })
    for (const snapshot of controller.getParallelSnapshots()) {
      controller.openDefinition(snapshot.sessionId)
    }

    const TestOverlayProvider = OverlayProvider as ComponentType<
      Omit<OverlayProviderProps, 'children'> & { children?: ReactNode }
    >
    const markup = renderToStaticMarkup(
      createElement(TestOverlayProvider, {
        controller,
        renderers: { alert: () => null, confirm: () => null },
      }),
    )

    expect(markup).toContain('<output>toast-a:true:open</output>')
    expect(markup).toContain('<output>toast-b:true:open</output>')
  })

  it('parallel upsert는 Promise와 group을 유지하며 input만 갱신한다', async () => {
    const controller = createOverlayController()
    const first = controller.overlay.upsert(
      projectSettings,
      'toast-a',
      { projectId: 'before' },
      { group: toastGroup, dismiss: 'block' },
    )
    const [parallelSnapshot] = controller.getParallelSnapshots()
    if (!parallelSnapshot) throw new Error('parallel snapshot이 필요합니다.')
    const sessionId = parallelSnapshot.sessionId
    controller.openDefinition(sessionId)

    const updated = controller.overlay.upsert(projectSettings, 'toast-a', {
      projectId: 'after',
    })

    expect(updated).toBe(first)
    expect(controller.getParallelSnapshots()).toMatchObject([
      {
        input: { projectId: 'after' },
        options: { group: toastGroup, dismiss: 'block' },
        status: 'open',
      },
    ])

    expect(() =>
      controller.overlay.upsert(
        projectSettings,
        'toast-a',
        { projectId: 'moved' },
        { group: defineOverlayGroup({ strategy: 'parallel' }) },
      ),
    ).toThrow('활성 upsert 세션의 overlay group은 변경할 수 없습니다.')
    expect(controller.getParallelSnapshots()).toMatchObject([
      { input: { projectId: 'after' }, options: { group: toastGroup, dismiss: 'block' } },
    ])

    controller.resolveDefinition(sessionId, { saved: true })
    await expect(first).resolves.toEqual({ status: 'resolved', value: { saved: true } })
  })

  it('dismissAll은 serial queue와 parallel session을 같은 이유로 정리한다', async () => {
    const controller = createOverlayController()
    const serial = controller.overlay.open(projectSettings, { projectId: 'modal' })
    const parallel = controller.overlay.open(
      projectSettings,
      { projectId: 'toast' },
      { group: toastGroup },
    )
    const [parallelSnapshot] = controller.getParallelSnapshots()
    if (!parallelSnapshot) throw new Error('parallel snapshot이 필요합니다.')
    const parallelSessionId = parallelSnapshot.sessionId

    controller.openCurrent()
    controller.openDefinition(parallelSessionId)
    controller.overlay.dismissAll('route-change')

    await expect(serial).resolves.toEqual({ status: 'dismissed', reason: 'route-change' })
    await expect(parallel).resolves.toEqual({ status: 'dismissed', reason: 'route-change' })
    expect(controller.getParallelSnapshots()).toMatchObject([
      { sessionId: parallelSessionId, status: 'closing', open: false },
    ])
  })

  it('dismissAll은 이미 closing인 session을 유지하고 mounting session은 즉시 제거한다', async () => {
    const controller = createOverlayController()
    const first = controller.overlay.open(
      projectSettings,
      { projectId: 'closing' },
      { group: toastGroup },
    )
    const second = controller.overlay.open(
      projectSettings,
      { projectId: 'mounting' },
      { group: toastGroup },
    )
    const [firstSnapshot, secondSnapshot] = controller.getParallelSnapshots()
    if (!firstSnapshot || !secondSnapshot) throw new Error('parallel snapshot이 필요합니다.')

    controller.openDefinition(firstSnapshot.sessionId)
    controller.dismissDefinition(firstSnapshot.sessionId, 'cancel')
    controller.overlay.dismissAll('route-change')

    await expect(first).resolves.toEqual({ status: 'dismissed', reason: 'cancel' })
    await expect(second).resolves.toEqual({ status: 'dismissed', reason: 'route-change' })
    expect(controller.getParallelSnapshots()).toMatchObject([
      { sessionId: firstSnapshot.sessionId, status: 'closing', open: false },
    ])
  })

  it('parallel dismiss block은 requestClose만 막고 명시적인 dismiss는 허용한다', async () => {
    const controller = createOverlayController()
    const result = controller.overlay.open(
      projectSettings,
      { projectId: 'blocked' },
      { group: toastGroup, dismiss: 'block' },
    )
    const [snapshot] = controller.getParallelSnapshots()
    if (!snapshot) throw new Error('parallel snapshot이 필요합니다.')
    controller.openDefinition(snapshot.sessionId)

    controller.requestDefinitionClose(snapshot.sessionId, 'outside')
    expect(controller.getParallelSnapshots()).toMatchObject([{ open: true, status: 'open' }])

    controller.dismissDefinition(snapshot.sessionId, 'cancel')
    await expect(result).resolves.toEqual({ status: 'dismissed', reason: 'cancel' })
  })
})

describe('overlay definition controller', () => {
  it('alert, definition, confirm을 같은 session queue에서 순서대로 처리한다', async () => {
    const controller = createOverlayController()
    const alertResult = controller.overlay.alert({ title: '먼저 안내' })
    const definitionResult = controller.overlay.open(projectSettings, {
      projectId: 'project-a',
    })
    const confirmResult = controller.overlay.confirm({
      title: '마지막 확인',
      confirmLabel: '확인',
    })

    expect(controller.getSnapshot()).toMatchObject({ kind: 'alert', status: 'mounting' })
    controller.openCurrent()
    controller.acknowledgeCurrent()
    await expect(alertResult).resolves.toBeUndefined()

    controller.completeClose()
    expect(controller.getSnapshot()).toMatchObject({
      kind: 'definition',
      input: { projectId: 'project-a' },
      status: 'mounting',
    })
    controller.openCurrent()
    controller.resolveDefinitionCurrent({ saved: true })
    controller.resolveDefinitionCurrent({ saved: false })
    await expect(definitionResult).resolves.toEqual({
      status: 'resolved',
      value: { saved: true },
    })

    controller.completeClose()
    expect(controller.getSnapshot()).toMatchObject({ kind: 'confirm', status: 'mounting' })
    controller.openCurrent()
    controller.cancelCurrent()
    await expect(confirmResult).resolves.toBe(false)
  })

  it('Provider가 definition input과 session 상태를 렌더링한다', () => {
    const controller = createOverlayController()
    controller.overlay.open(projectSettings, { projectId: 'project-a' })

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
    expect(mountingMarkup).toContain('<output>project-a:false:mounting</output>')

    controller.openCurrent()
    const openMarkup = renderToStaticMarkup(createElement(TestOverlayProvider, providerProps, null))
    expect(openMarkup).toContain('<output>project-a:true:open</output>')
  })

  it('resolve 결과를 명시적인 resolved outcome으로 반환한다', async () => {
    const controller = createOverlayController()
    const result = controller.overlay.open(projectSettings, { projectId: 'project-a' })

    controller.openCurrent()
    controller.resolveDefinitionCurrent({ saved: true })

    await expect(result).resolves.toEqual({
      status: 'resolved',
      value: { saved: true },
    })
    expect(controller.getSnapshot()).toMatchObject({
      kind: 'definition',
      open: false,
      status: 'closing',
    })
  })

  it('dismiss 이유를 outcome에 보존한다', async () => {
    const controller = createOverlayController()
    const result = controller.overlay.open(projectSettings, { projectId: 'project-a' })

    controller.openCurrent()
    controller.requestClose('escape')

    await expect(result).resolves.toEqual({
      status: 'dismissed',
      reason: 'escape',
    })
  })

  it('같은 definition을 열어도 자동 dedupe하지 않고 입력별로 대기한다', async () => {
    const controller = createOverlayController()
    const first = controller.overlay.open(projectSettings, { projectId: 'project-a' })
    const second = controller.overlay.open(projectSettings, { projectId: 'project-b' })

    expect(second).not.toBe(first)
    expect(controller.getSnapshot()).toMatchObject({
      kind: 'definition',
      input: { projectId: 'project-a' },
    })

    controller.openCurrent()
    controller.dismissDefinitionCurrent('cancel')
    await expect(first).resolves.toEqual({ status: 'dismissed', reason: 'cancel' })

    controller.completeClose()
    expect(controller.getSnapshot()).toMatchObject({
      kind: 'definition',
      input: { projectId: 'project-b' },
      open: false,
      status: 'mounting',
    })

    controller.openCurrent()
    controller.dismissDefinitionCurrent('cancel')
    await expect(second).resolves.toEqual({ status: 'dismissed', reason: 'cancel' })
  })

  it('같은 definition과 identity를 upsert하면 Promise를 유지하고 현재 input을 갱신한다', async () => {
    const controller = createOverlayController()
    const first = controller.overlay.upsert(projectSettings, 'project-a', {
      projectId: 'before',
    })

    controller.openCurrent()
    const updated = controller.overlay.upsert(projectSettings, 'project-a', {
      projectId: 'after',
    })

    expect(updated).toBe(first)
    expect(controller.getSnapshot()).toMatchObject({
      kind: 'definition',
      open: true,
      input: { projectId: 'after' },
      status: 'open',
    })

    controller.resolveDefinitionCurrent({ saved: true })
    await expect(first).resolves.toEqual({ status: 'resolved', value: { saved: true } })
  })

  it('다른 identity의 upsert는 독립 Promise로 queue에 들어간다', async () => {
    const controller = createOverlayController()
    const first = controller.overlay.upsert(projectSettings, 'project-a', {
      projectId: 'project-a',
    })
    const second = controller.overlay.upsert(projectSettings, 'project-b', {
      projectId: 'project-b',
    })

    expect(second).not.toBe(first)
    controller.openCurrent()
    controller.dismissDefinitionCurrent('cancel')
    await expect(first).resolves.toEqual({ status: 'dismissed', reason: 'cancel' })

    controller.completeClose()
    expect(controller.getSnapshot()).toMatchObject({
      kind: 'definition',
      input: { projectId: 'project-b' },
      status: 'mounting',
    })

    controller.openCurrent()
    controller.dismissDefinitionCurrent('cancel')
    await expect(second).resolves.toEqual({ status: 'dismissed', reason: 'cancel' })
  })

  it('같은 identity라도 다른 definition이면 독립 세션을 만든다', () => {
    const controller = createOverlayController()
    const alternateProjectSettings = defineOverlay<ProjectSettingsInput, ProjectSettingsResult>(
      () => null,
    )
    const first = controller.overlay.upsert(projectSettings, 'project-a', {
      projectId: 'first',
    })
    const second = controller.overlay.upsert(alternateProjectSettings, 'project-a', {
      projectId: 'second',
    })

    expect(second).not.toBe(first)
    expect(controller.getSnapshot()).toMatchObject({ input: { projectId: 'first' } })
  })

  it('대기 중인 upsert도 열리기 전에 최신 input으로 갱신한다', async () => {
    const controller = createOverlayController()
    const blocking = controller.overlay.alert({ title: '먼저 안내' })
    const first = controller.overlay.upsert(projectSettings, 'project-a', {
      projectId: 'before',
    })
    const updated = controller.overlay.upsert(projectSettings, 'project-a', {
      projectId: 'after',
    })

    expect(updated).toBe(first)
    controller.openCurrent()
    controller.acknowledgeCurrent()
    await expect(blocking).resolves.toBeUndefined()
    controller.completeClose()

    expect(controller.getSnapshot()).toMatchObject({
      kind: 'definition',
      input: { projectId: 'after' },
      status: 'mounting',
    })
  })

  it('일반 open 세션과 upsert 세션은 같은 definition이어도 공유하지 않는다', () => {
    const controller = createOverlayController()
    const opened = controller.overlay.open(projectSettings, { projectId: 'opened' })
    const upserted = controller.overlay.upsert(projectSettings, 'project-a', {
      projectId: 'upserted',
    })

    expect(upserted).not.toBe(opened)
    expect(controller.getSnapshot()).toMatchObject({ input: { projectId: 'opened' } })
  })

  it('settle된 identity는 재사용하지 않고 새 세션을 만든다', async () => {
    const controller = createOverlayController()
    const first = controller.overlay.upsert(projectSettings, 'project-a', {
      projectId: 'first',
    })

    controller.openCurrent()
    controller.dismissDefinitionCurrent('cancel')
    await expect(first).resolves.toEqual({ status: 'dismissed', reason: 'cancel' })

    const second = controller.overlay.upsert(projectSettings, 'project-a', {
      projectId: 'second',
    })
    expect(second).not.toBe(first)

    controller.completeClose()
    expect(controller.getSnapshot()).toMatchObject({ input: { projectId: 'second' } })
  })

  it('upsert 옵션은 명시적으로 전달할 때만 갱신한다', async () => {
    const controller = createOverlayController()
    const result = controller.overlay.upsert(
      projectSettings,
      'project-a',
      { projectId: 'before' },
      { dismiss: 'block' },
    )

    controller.openCurrent()
    controller.overlay.upsert(projectSettings, 'project-a', { projectId: 'after' })
    controller.requestClose('outside')
    expect(controller.getSnapshot()).toMatchObject({ open: true, status: 'open' })

    controller.overlay.upsert(projectSettings, 'project-a', { projectId: 'after' }, {})
    controller.requestClose('outside')
    await expect(result).resolves.toEqual({ status: 'dismissed', reason: 'outside' })
  })

  it('dismiss block은 requestClose만 막고 명시적인 dismiss는 허용한다', async () => {
    const controller = createOverlayController()
    const result = controller.overlay.open(
      projectSettings,
      { projectId: 'project-a' },
      { dismiss: 'block' },
    )

    controller.openCurrent()
    controller.requestClose('outside')
    expect(controller.getSnapshot()).toMatchObject({ open: true, status: 'open' })

    controller.dismissDefinitionCurrent('cancel')
    await expect(result).resolves.toEqual({ status: 'dismissed', reason: 'cancel' })
  })

  it('dismissAll 이유를 현재와 대기 중인 definition 모두에 전달한다', async () => {
    const controller = createOverlayController()
    const current = controller.overlay.open(projectSettings, { projectId: 'project-a' })
    const queued = controller.overlay.open(projectSettings, { projectId: 'project-b' })

    controller.openCurrent()
    controller.overlay.dismissAll('route-change')

    await expect(current).resolves.toEqual({
      status: 'dismissed',
      reason: 'route-change',
    })
    await expect(queued).resolves.toEqual({
      status: 'dismissed',
      reason: 'route-change',
    })
  })
})
