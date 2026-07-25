import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import {
  getDialogScaffoldFiles,
  getNextAppRouterProviderTemplate,
  getOverlayScaffoldFiles,
} from './templates'

const storybookOverlayDirectory = new URL('../../../apps/storybook/src/overlays/', import.meta.url)
const storybookPreview = new URL('../../../apps/storybook/.storybook/preview.tsx', import.meta.url)

const scaffoldFiles = new Map(
  getOverlayScaffoldFiles('css-modules').map((file) => [file.name, file.content] as const),
)

describe('overlay 생성 템플릿', () => {
  it.each([
    'scope.ts',
    'alert/AlertSurface.tsx',
    'alert/Alert.module.css',
    'confirm/ConfirmSurface.tsx',
    'confirm/Confirm.module.css',
    'OverlayProvider.tsx',
  ])('%s가 Storybook 검증본과 일치한다', async (name) => {
    const storybookFile = fileURLToPath(new URL(name, storybookOverlayDirectory))
    const storybookContent = await readFile(storybookFile, 'utf8')

    expect(storybookContent).toBe(scaffoldFiles.get(name))
  })

  it('앱 소유 scope와 렌더러 request 계약을 생성한다', async () => {
    const scope = scaffoldFiles.get('scope.ts')
    const provider = scaffoldFiles.get('OverlayProvider.tsx')
    const alert = scaffoldFiles.get('alert/AlertSurface.tsx')
    const confirm = scaffoldFiles.get('confirm/ConfirmSurface.tsx')
    const preview = await readFile(fileURLToPath(storybookPreview), 'utf8')

    expect(scope).toContain('createOverlayScope<AppOverlayRequests>()')
    expect(scope).toContain('export const useOverlay = appOverlay.useOverlay')
    expect(provider).toContain('satisfies OverlayRenderers<AppOverlayRequests>')
    expect(provider).toContain('<appOverlay.OverlayProvider renderers={renderers}>')
    expect(alert).toContain('AlertRendererProps<AppAlertRequest>')
    expect(alert).toContain('onClick={action}')
    expect(alert).not.toContain('requestClose')
    expect(confirm).toContain('ConfirmRendererProps<AppConfirmRequest>')
    expect(confirm).toContain("actionStatus === 'pending'")
    expect(confirm).toContain("actionStatus === 'error'")
    expect(confirm).toContain('onClick={confirm}')
    expect(confirm).toContain('onClick={handleCancel}')
    expect(confirm).toContain('requestClose(')
    expect(preview).toContain('<OverlayProvider>')
  })

  it('Next App Router 연결 파일은 로컬 오버레이 Provider만 감싼다', () => {
    const provider = getNextAppRouterProviderTemplate('../overlays/OverlayProvider')

    expect(provider).toContain("'use client'")
    expect(provider).toContain("import { OverlayProvider } from '../overlays/OverlayProvider'")
    expect(provider).toContain('<OverlayProvider>{children}</OverlayProvider>')
  })

  it('Tailwind v4 출력도 같은 scope 계약과 관리 동작을 유지한다', () => {
    const files = new Map(
      getOverlayScaffoldFiles('tailwind-v4').map((file) => [file.name, file.content]),
    )

    expect(files.has('alert/Alert.module.css')).toBe(false)
    expect(files.has('confirm/Confirm.module.css')).toBe(false)
    expect(files.get('scope.ts')).toBe(scaffoldFiles.get('scope.ts'))
    expect(files.get('OverlayProvider.tsx')).toBe(scaffoldFiles.get('OverlayProvider.tsx'))
    expect(files.get('alert/AlertSurface.tsx')).toContain('onClick={action}')
    expect(files.get('confirm/ConfirmSurface.tsx')).toContain('onClick={confirm}')
    expect(files.get('confirm/ConfirmSurface.tsx')).toContain('z-[3001]')
    expect(files.get('confirm/ConfirmSurface.tsx')).not.toContain("import './Confirm.css'")
  })

  it('Dialog는 JSX props와 useOverlaySession 결과 계약을 생성한다', () => {
    const dialogFiles = new Map(
      getDialogScaffoldFiles('project-settings', 'css-modules').map((file) => [
        file.name,
        file.content,
      ]),
    )
    const component = dialogFiles.get('ProjectSettingsDialog.tsx')

    expect(dialogFiles.has('ProjectSettingsDialog.module.css')).toBe(true)
    expect(component).toContain('export function ProjectSettingsDialog({')
    expect(component).toContain('useOverlaySession<ProjectSettingsDialogResult>()')
    expect(component).toContain('requestClose(')
    expect(component).toContain('completeClose()')
    expect(component).toContain("close('cancel')")
    expect(component).toContain('resolve({ completed: true })')
    expect(component).not.toContain('defineOverlay')
    expect(component).not.toContain('OverlayDefinitionComponentProps')
  })
})
