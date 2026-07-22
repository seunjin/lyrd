import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  getDialogScaffoldFiles,
  getNextAppRouterProviderTemplate,
  getOverlayScaffoldFiles,
  getToastScaffoldFiles,
} from './templates'

const storybookOverlayDirectory = new URL('../../../apps/storybook/src/overlays/', import.meta.url)
const storybookPreview = new URL('../../../apps/storybook/.storybook/preview.tsx', import.meta.url)
const nextOverlayDirectory = new URL(
  '../../../tests/consumers/fixtures/next-app-router/src/overlays/',
  import.meta.url,
)
const viteOverlayDirectory = new URL(
  '../../../tests/consumers/fixtures/vite-react/src/overlays/',
  import.meta.url,
)

const scaffoldFiles = new Map(
  getOverlayScaffoldFiles('css-modules').map((file) => [file.name, file.content] as const),
)

describe('overlay 생성 템플릿', () => {
  it.each([
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

  it('생성 Provider와 Storybook이 동일한 렌더러 등록 계약을 사용한다', async () => {
    const registration = 'renderers={{ alert: AlertSurface, confirm: ConfirmSurface }}'
    const providerTemplate = scaffoldFiles.get('OverlayProvider.tsx')
    const previewContent = await readFile(fileURLToPath(storybookPreview), 'utf8')

    expect(providerTemplate).toContain(registration)
    expect(providerTemplate).toContain('export function OverlayProvider')
    expect(providerTemplate).not.toContain('AppOverlayProvider')
    expect(previewContent).toContain('<OverlayProvider>')
  })

  it('Next App Router 연결 파일은 로컬 오버레이 Provider만 감싼다', () => {
    const providerTemplate = getNextAppRouterProviderTemplate('../overlays/OverlayProvider')

    expect(providerTemplate).toContain("'use client'")
    expect(providerTemplate).toContain(
      "import { OverlayProvider } from '../overlays/OverlayProvider'",
    )
    expect(providerTemplate).toContain('<OverlayProvider>{children}</OverlayProvider>')
  })

  it('Tailwind v4 Overlay 출력이 Next fixture 검증본과 일치한다', async () => {
    for (const file of getOverlayScaffoldFiles('tailwind-v4')) {
      const fixtureFile = fileURLToPath(new URL(file.name, nextOverlayDirectory))
      await expect(readFile(fixtureFile, 'utf8')).resolves.toBe(file.content)
    }
  })

  it('이름에 맞는 앱 소유 Dialog 컴포넌트와 전용 스타일을 생성한다', () => {
    const dialogFiles = new Map(
      getDialogScaffoldFiles('project-settings', 'css-modules').map((file) => [
        file.name,
        file.content,
      ]),
    )
    const component = dialogFiles.get('ProjectSettingsDialog.tsx')

    expect(dialogFiles.has('ProjectSettingsDialog.module.css')).toBe(true)
    expect(component).toContain('function ProjectSettingsDialog')
    expect(component).toContain('OverlayDefinitionComponentProps<')
    expect(component).toContain(
      'export const projectSettingsDialog = defineOverlay(ProjectSettingsDialog)',
    )
    expect(component).toContain('onOpenChangeComplete')
    expect(component).toContain("session.dismiss('cancel')")
    expect(component).toContain('session.resolve({ completed: true })')
  })

  it.each([
    ['css-modules', viteOverlayDirectory],
    ['tailwind-v4', nextOverlayDirectory],
  ] as const)('%s Dialog 출력이 consumer fixture 검증본과 일치한다', async (styling, root) => {
    for (const file of getDialogScaffoldFiles('consumer-lab', styling)) {
      const fixtureFile = fileURLToPath(new URL(`dialogs/consumer-lab/${file.name}`, root))
      await expect(readFile(fixtureFile, 'utf8')).resolves.toBe(file.content)
    }
  })

  it('병렬 그룹과 앱 소유 helper를 사용하는 Toast adapter를 생성한다', async () => {
    const toastFiles = new Map(
      getToastScaffoldFiles('css-modules').map((file) => [file.name, file.content]),
    )
    const definition = toastFiles.get('toast/definition.ts')
    const component = toastFiles.get('toast/AppToastProvider.tsx')
    const manager = toastFiles.get('toast/manager.ts')
    const notify = toastFiles.get('toast/notify.ts')

    expect(notify).toContain("strategy: 'parallel'")
    expect(toastFiles.get('toast/Toast.module.css')).toContain('.Toast[data-limited]')
    expect(component).toContain('toastManager={appToastManager}')
    expect(component).toContain('export function AppToastProvider()')
    expect(component).not.toContain('{children}')
    expect(component).not.toContain('limit=')
    expect(component).toContain('toast.data?.undo ?')
    expect(component).not.toContain('export const appToast')
    expect(definition).toContain('export const appToast = defineOverlay(AppToast)')
    expect(definition).not.toContain('Toast.useToastManager')
    expect(definition).toContain('appToastManager.add')
    expect(manager).toContain('Toast.createToastManager<AppToastData>()')
    expect(definition).toContain("sessionRef.current.resolve({ action: 'undo' })")
    expect(definition).toContain("sessionRef.current.dismiss('programmatic')")
    expect(definition).not.toContain("action: 'dismissed'")
    expect(notify).toContain('export function notify(')
    expect(notify).toContain('export async function notifyWithUndo(')
    expect(notify).toContain('toastId: crypto.randomUUID()')

    for (const [name, content] of toastFiles) {
      const storybookFile = fileURLToPath(new URL(name, storybookOverlayDirectory))
      await expect(readFile(storybookFile, 'utf8')).resolves.toBe(content)
    }
  })

  it('Tailwind v4 Toast 출력이 Next fixture 검증본과 일치한다', async () => {
    for (const file of getToastScaffoldFiles('tailwind-v4')) {
      const fixtureFile = fileURLToPath(new URL(file.name, nextOverlayDirectory))
      await expect(readFile(fixtureFile, 'utf8')).resolves.toBe(file.content)
    }
  })
})
