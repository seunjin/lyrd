import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  getDialogScaffoldFiles,
  getNextAppRouterProviderTemplate,
  getOverlayScaffoldFiles,
} from './templates'

const storybookOverlayDirectory = new URL('../../../apps/storybook/src/lyrd/', import.meta.url)
const storybookPreview = new URL('../../../apps/storybook/.storybook/preview.tsx', import.meta.url)

const scaffoldFiles = new Map(
  getOverlayScaffoldFiles().map((file) => [file.name, file.content] as const),
)

describe('overlay 생성 템플릿', () => {
  it.each([
    'alert.tsx',
    'confirm.tsx',
    'overlay.css',
  ])('%s가 Storybook 검증본과 일치한다', async (name) => {
    const storybookFile = fileURLToPath(new URL(name, storybookOverlayDirectory))
    const storybookContent = await readFile(storybookFile, 'utf8')

    expect(storybookContent).toBe(scaffoldFiles.get(name))
  })

  it('생성 Provider와 Storybook이 동일한 렌더러 등록 계약을 사용한다', async () => {
    const registration = 'renderers={{ alert: AlertSurface, confirm: ConfirmSurface }}'
    const providerTemplate = scaffoldFiles.get('overlay-provider.tsx')
    const previewContent = await readFile(fileURLToPath(storybookPreview), 'utf8')

    expect(providerTemplate).toContain(registration)
    expect(previewContent).toContain(registration)
  })

  it('Next App Router 연결 파일은 로컬 오버레이 Provider만 감싼다', () => {
    const providerTemplate = getNextAppRouterProviderTemplate('../lyrd/overlay/overlay-provider')

    expect(providerTemplate).toContain("'use client'")
    expect(providerTemplate).toContain(
      "import { AppOverlayProvider } from '../lyrd/overlay/overlay-provider'",
    )
    expect(providerTemplate).toContain('<AppOverlayProvider>{children}</AppOverlayProvider>')
  })

  it('이름에 맞는 앱 소유 Dialog 컴포넌트와 공유 스타일을 생성한다', () => {
    const dialogFiles = new Map(
      getDialogScaffoldFiles('project-settings').map((file) => [file.name, file.content]),
    )
    const component = dialogFiles.get('project-settings-dialog.tsx')

    expect(dialogFiles.has('dialog.css')).toBe(true)
    expect(component).toContain('export function ProjectSettingsDialog')
    expect(component).toContain('useOverlayDialog<ProjectSettingsDialogResult>()')
    expect(component).toContain('onOpenChangeComplete')
    expect(component).toContain('dialog.resolve({ completed: true })')
  })
})
