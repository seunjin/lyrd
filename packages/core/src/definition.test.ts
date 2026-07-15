import { type ComponentType, createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { createOverlayController } from './controller'
import { defineOverlay } from './definition'
import { OverlayProvider, type OverlayProviderProps } from './provider'
import type { OverlayOutcome } from './types'

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

  it('definition의 session resolve에 선언한 result 타입을 연결한다', () => {
    defineOverlay<ProjectSettingsInput, ProjectSettingsResult>(({ session }) => {
      session.resolve({ saved: true })

      // @ts-expect-error saved는 true 리터럴이어야 한다.
      session.resolve({ saved: false })

      return null
    })
  })
})

describe('overlay definition controller', () => {
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
