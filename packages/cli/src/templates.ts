import type { Styling } from './types'

function alertTemplate(): string {
  return `'use client'

import { AlertDialog } from '@base-ui/react/alert-dialog'
import type { AlertRendererProps } from '@lyrd/core'

import type { AppAlertRequest } from '../scope'
import './Alert.css'

export function AlertSurface({
  action,
  completeClose,
  open,
  request,
}: AlertRendererProps<AppAlertRequest>) {
  return (
    <AlertDialog.Root open={open} onOpenChangeComplete={(nextOpen) => !nextOpen && completeClose()}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="lyrd-overlay-backdrop" />
        <AlertDialog.Popup className="lyrd-overlay-popup">
          <div className="lyrd-overlay-intro">
            <AlertDialog.Title className="lyrd-overlay-title">{request.title}</AlertDialog.Title>
            {request.description ? (
              <AlertDialog.Description className="lyrd-overlay-description">
                {request.description}
              </AlertDialog.Description>
            ) : null}
          </div>
          <div className="lyrd-overlay-actions">
            <button className="lyrd-overlay-button" onClick={action} type="button">
              {request.actionLabel ?? '확인'}
            </button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
`
}

function confirmTemplate(): string {
  return `'use client'

import { AlertDialog } from '@base-ui/react/alert-dialog'
import type { ConfirmRendererProps } from '@lyrd/core'

import type { AppConfirmRequest } from '../scope'
import './Confirm.css'

export function ConfirmSurface({
  actionStatus,
  cancel,
  completeClose,
  confirm,
  error,
  open,
  request,
  requestClose,
}: ConfirmRendererProps<AppConfirmRequest>) {
  const pending = actionStatus === 'pending'

  function handleCancel() {
    request.onCancel?.()
    cancel()
  }

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(nextOpen, eventDetails) =>
        !nextOpen && requestClose(eventDetails.reason === 'escape-key' ? 'escape' : 'outside')
      }
      onOpenChangeComplete={(nextOpen) => !nextOpen && completeClose()}
    >
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="lyrd-overlay-backdrop" />
        <AlertDialog.Popup className="lyrd-overlay-popup">
          <div className="lyrd-overlay-intro">
            <AlertDialog.Title className="lyrd-overlay-title">{request.title}</AlertDialog.Title>
            {request.description ? (
              <AlertDialog.Description className="lyrd-overlay-description">
                {request.description}
              </AlertDialog.Description>
            ) : null}
            {actionStatus === 'error' ? (
              <p className="lyrd-overlay-error" role="alert">
                작업을 완료하지 못했습니다. 다시 시도해 주세요.
                {error instanceof Error ? \` (\${error.message})\` : null}
              </p>
            ) : null}
          </div>
          <div className="lyrd-overlay-actions">
            <button
              className="lyrd-overlay-button"
              disabled={pending}
              onClick={handleCancel}
              type="button"
            >
              {request.cancelLabel ?? '취소'}
            </button>
            <button
              aria-busy={pending}
              className="lyrd-overlay-button"
              data-color={request.tone === 'danger' ? 'red' : undefined}
              data-tone={request.tone ?? 'neutral'}
              disabled={pending}
              onClick={confirm}
              type="button"
            >
              {pending ? '처리 중' : (request.confirmLabel ?? '확인')}
            </button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
`
}

function overlayScopeTemplate(): string {
  return `import { createOverlayScope } from '@lyrd/core'
import type { ReactNode } from 'react'

export type AppAlertRequest = {
  title: ReactNode
  description?: ReactNode
  actionLabel?: ReactNode
}

export type AppConfirmRequest = {
  title: ReactNode
  description?: ReactNode
  confirmLabel?: ReactNode
  cancelLabel?: ReactNode
  tone?: 'neutral' | 'danger'
  onCancel?: () => void
}

export type AppOverlayRequests = {
  alert: AppAlertRequest
  confirm: AppConfirmRequest
}

export const appOverlay = createOverlayScope<AppOverlayRequests>()
export const useOverlay = appOverlay.useOverlay
`
}

function overlayProviderTemplate(): string {
  return `'use client'

import type { OverlayRenderers } from '@lyrd/core'
import type { ReactNode } from 'react'

import { AlertSurface } from './alert/AlertSurface'
import { ConfirmSurface } from './confirm/ConfirmSurface'
import { type AppOverlayRequests, appOverlay } from './scope'

const renderers = {
  alert: AlertSurface,
  confirm: ConfirmSurface,
} satisfies OverlayRenderers<AppOverlayRequests>

export function OverlayProvider({ children }: { children: ReactNode }) {
  return <appOverlay.OverlayProvider renderers={renderers}>{children}</appOverlay.OverlayProvider>
}
`
}

function overlayCssTemplate(): string {
  return `.lyrd-overlay-button {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 2rem;
  padding: 0 0.75rem;
  margin: 0;
  border: 1px solid oklch(14.5% 0 0deg);
  background-color: white;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1;
  white-space: nowrap;
  color: oklch(14.5% 0 0deg);
  -webkit-user-select: none;
  user-select: none;
}

.lyrd-overlay-button[data-color="red"] {
  color: oklch(50.5% 0.213 27.518deg);
}

@media (hover: hover) {
  .lyrd-overlay-button:hover:not([data-disabled]) {
    background-color: oklch(97% 0 0deg);
  }
}

.lyrd-overlay-button:active:not([data-disabled]) {
  background-color: oklch(92.2% 0 0deg);
}

.lyrd-overlay-button:focus-visible {
  outline: 2px solid oklch(14.5% 0 0deg);
  outline-offset: -1px;
}

.lyrd-overlay-button[data-disabled],
.lyrd-overlay-button:disabled {
  color: oklch(55.6% 0 0deg);
  border-color: oklch(55.6% 0 0deg);
}

.lyrd-overlay-backdrop {
  position: fixed;
  min-height: 100dvh;
  inset: 0;
  background-color: black;
  opacity: 0.2;
  transition: opacity 150ms;
  z-index: 3000;
}

.lyrd-overlay-backdrop[data-starting-style],
.lyrd-overlay-backdrop[data-ending-style] {
  opacity: 0;
}

@supports (-webkit-touch-callout: none) {
  .lyrd-overlay-backdrop {
    position: absolute;
  }
}

.lyrd-overlay-popup {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24rem;
  max-width: calc(100vw - 3rem);
  margin-top: -2rem;
  padding: 1rem;
  border: 1px solid oklch(14.5% 0 0deg);
  background-color: white;
  color: oklch(14.5% 0 0deg);
  box-shadow: 0.25rem 0.25rem 0 rgb(0 0 0 / 12%);
  transition:
    transform 100ms ease-out,
    opacity 100ms ease-out;
  z-index: 3001;
}

.lyrd-overlay-popup[data-starting-style],
.lyrd-overlay-popup[data-ending-style] {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.98);
}

.lyrd-overlay-intro {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.lyrd-overlay-title,
.lyrd-overlay-description {
  margin: 0;
}

.lyrd-overlay-error {
  margin: 0.5rem 0 0;
  color: oklch(50.5% 0.213 27.518deg);
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.lyrd-overlay-title {
  font-size: 1rem;
  line-height: 1.5rem;
  font-weight: 700;
}

.lyrd-overlay-description {
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: oklch(43.9% 0 0deg);
}

.lyrd-overlay-actions {
  display: flex;
  justify-content: end;
  gap: 0.75rem;
}

@media (prefers-color-scheme: dark) {
  .lyrd-overlay-button,
  .lyrd-overlay-popup {
    border-color: white;
    background-color: oklch(14.5% 0 0deg);
    color: white;
  }

  .lyrd-overlay-button[data-color="red"] {
    color: oklch(70.4% 0.191 22.216deg);
  }

  .lyrd-overlay-button:hover:not([data-disabled]) {
    background-color: oklch(26.9% 0 0deg);
  }

  .lyrd-overlay-button:active:not([data-disabled]) {
    background-color: oklch(37.1% 0 0deg);
  }

  .lyrd-overlay-button[data-disabled],
  .lyrd-overlay-button:disabled {
    color: oklch(70.8% 0 0deg);
    border-color: oklch(70.8% 0 0deg);
  }

  .lyrd-overlay-button:focus-visible {
    outline-color: white;
  }

  .lyrd-overlay-backdrop {
    opacity: 0.5;
  }

  .lyrd-overlay-popup {
    box-shadow: none;
  }

  .lyrd-overlay-description {
    color: oklch(70.8% 0 0deg);
  }
}
`
}

export function getOverlayScaffoldFiles(
  styling: Styling,
): Array<{ name: string; content: string }> {
  const files = [
    { name: 'scope.ts', content: overlayScopeTemplate() },
    {
      name: 'alert/AlertSurface.tsx',
      content: styleComponent(alertTemplate(), styling, overlayClasses, 'Alert'),
    },
    {
      name: 'confirm/ConfirmSurface.tsx',
      content: styleComponent(confirmTemplate(), styling, overlayClasses, 'Confirm'),
    },
    { name: 'OverlayProvider.tsx', content: overlayProviderTemplate() },
  ]
  if (styling === 'css-modules') {
    files.push({
      name: 'alert/Alert.module.css',
      content: cssModule(overlayCssTemplate(), overlayClasses),
    })
    files.push({
      name: 'confirm/Confirm.module.css',
      content: cssModule(overlayCssTemplate(), overlayClasses),
    })
  }
  return files
}

export function getNextAppRouterProviderTemplate(providerImportPath: string): string {
  return `'use client'

import type { ReactNode } from 'react'

import { OverlayProvider } from '${providerImportPath}'

export function LyrdOverlayProvider({ children }: { children: ReactNode }) {
  return <OverlayProvider>{children}</OverlayProvider>
}
`
}

function dialogComponentTemplate(dialogName: string): string {
  const componentName = dialogName
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('')
  const title = dialogName.replaceAll('-', ' ')

  return `'use client'

import { Dialog } from '@base-ui/react/dialog'
import { useOverlaySession } from '@lyrd/core'
import type { ReactNode } from 'react'

import './${componentName}Dialog.css'

export type ${componentName}DialogResult = {
  completed: true
}

export type ${componentName}DialogProps = {
  children?: ReactNode
  description?: ReactNode
  title?: ReactNode
}

export function ${componentName}Dialog({
  children,
  description = '이 설명과 화면 내용을 제품 흐름에 맞게 수정하세요.',
  title = '${title}',
}: ${componentName}DialogProps) {
  const session = useOverlaySession<${componentName}DialogResult>()
  const {
    open,
    requestClose,
    completeClose,
    close,
    resolve,
  } = session

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen, eventDetails) =>
        !nextOpen &&
        requestClose(eventDetails.reason === 'escape-key' ? 'escape' : 'outside')
      }
      onOpenChangeComplete={(nextOpen) => !nextOpen && completeClose()}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="lyrd-dialog-backdrop" />
        <Dialog.Popup className="lyrd-dialog-popup">
          <header className="lyrd-dialog-intro">
            <div>
              <Dialog.Title className="lyrd-dialog-title">{title}</Dialog.Title>
              <Dialog.Description className="lyrd-dialog-description">{description}</Dialog.Description>
            </div>
          </header>

          {children ? <div className="lyrd-dialog-content">{children}</div> : null}

          <footer className="lyrd-dialog-actions">
            <button
              className="lyrd-dialog-button"
              onClick={() => close('cancel')}
              type="button"
            >
              취소
            </button>
            <button
              className="lyrd-dialog-button"
              onClick={() => resolve({ completed: true })}
              type="button"
            >
              완료
            </button>
          </footer>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
`
}

function dialogCssTemplate(): string {
  return `.lyrd-dialog-backdrop {
  position: fixed;
  min-height: 100dvh;
  inset: 0;
  background-color: black;
  opacity: 0.2;
  transition: opacity 150ms;
}

.lyrd-dialog-backdrop[data-starting-style],
.lyrd-dialog-backdrop[data-ending-style] {
  opacity: 0;
}

@supports (-webkit-touch-callout: none) {
  .lyrd-dialog-backdrop {
    position: absolute;
  }
}

.lyrd-dialog-popup {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24rem;
  max-width: calc(100vw - 3rem);
  margin-top: -2rem;
  padding: 1rem;
  border: 1px solid oklch(14.5% 0 0deg);
  background-color: white;
  color: oklch(14.5% 0 0deg);
  box-shadow: 0.25rem 0.25rem 0 rgb(0 0 0 / 12%);
  transition:
    transform 100ms ease-out,
    opacity 100ms ease-out;
}

.lyrd-dialog-popup[data-starting-style],
.lyrd-dialog-popup[data-ending-style] {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.98);
}

.lyrd-dialog-intro {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.lyrd-dialog-title,
.lyrd-dialog-description {
  margin: 0;
}

.lyrd-dialog-title {
  font-size: 1rem;
  line-height: 1.5rem;
  font-weight: 700;
}

.lyrd-dialog-description {
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: oklch(43.9% 0 0deg);
}

.lyrd-dialog-content {
  min-width: 0;
}

.lyrd-dialog-actions {
  display: flex;
  justify-content: end;
  gap: 0.75rem;
}

.lyrd-dialog-button {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 2rem;
  padding: 0 0.75rem;
  margin: 0;
  border: 1px solid oklch(14.5% 0 0deg);
  background-color: white;
  color: oklch(14.5% 0 0deg);
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1;
  white-space: nowrap;
}

@media (prefers-color-scheme: dark) {
  .lyrd-dialog-backdrop {
    opacity: 0.5;
  }

  .lyrd-dialog-popup,
  .lyrd-dialog-button {
    border-color: white;
    background-color: oklch(14.5% 0 0deg);
    color: white;
  }

  .lyrd-dialog-popup {
    box-shadow: none;
  }

  .lyrd-dialog-description {
    color: oklch(70.8% 0 0deg);
  }
}
`
}

export function getDialogScaffoldFiles(
  dialogName: string,
  styling: Styling,
): Array<{ name: string; content: string }> {
  const componentName = dialogName
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('')
  const files = [
    {
      name: `${componentName}Dialog.tsx`,
      content: styleComponent(
        dialogComponentTemplate(dialogName),
        styling,
        dialogClasses,
        `${componentName}Dialog`,
      ),
    },
  ]
  if (styling === 'css-modules') {
    files.push({
      name: `${componentName}Dialog.module.css`,
      content: cssModule(dialogCssTemplate(), dialogClasses),
    })
  }
  return files
}
type ClassDefinition = { module: string; tailwind: string }
type ClassMap = Record<string, ClassDefinition>

const overlayClasses: ClassMap = {
  'lyrd-overlay-backdrop': {
    module: 'Backdrop',
    tailwind:
      'fixed inset-0 z-[3000] min-h-dvh bg-black opacity-20 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 dark:opacity-50 supports-[-webkit-touch-callout:none]:absolute',
  },
  'lyrd-overlay-popup': {
    module: 'Popup',
    tailwind:
      'fixed top-1/2 left-1/2 z-[3001] -mt-8 flex w-96 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 border border-neutral-950 bg-white p-4 text-neutral-950 shadow-[0.25rem_0.25rem_0] shadow-black/12 transition-[scale,opacity] duration-100 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none',
  },
  'lyrd-overlay-intro': { module: 'Intro', tailwind: 'flex flex-col gap-1' },
  'lyrd-overlay-title': { module: 'Title', tailwind: 'm-0 text-base font-bold' },
  'lyrd-overlay-description': {
    module: 'Description',
    tailwind: 'm-0 text-sm text-neutral-600 dark:text-neutral-400',
  },
  'lyrd-overlay-error': {
    module: 'Error',
    tailwind: 'mt-2 mb-0 text-sm text-red-700 dark:text-red-400',
  },
  'lyrd-overlay-actions': { module: 'Actions', tailwind: 'flex justify-end gap-3' },
  'lyrd-overlay-button': {
    module: 'Button',
    tailwind:
      'flex h-8 items-center justify-center gap-2 border border-neutral-950 bg-white px-3 text-sm leading-none whitespace-nowrap font-normal text-neutral-950 select-none hover:not-data-disabled:bg-neutral-100 active:not-data-disabled:bg-neutral-200 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:not-data-disabled:bg-neutral-800 dark:active:not-data-disabled:bg-neutral-700 data-[color=red]:text-red-700 dark:data-[color=red]:text-red-400 disabled:border-neutral-500 disabled:text-neutral-500 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white',
  },
}

const dialogClasses: ClassMap = {
  'lyrd-dialog-backdrop': {
    module: 'Backdrop',
    tailwind: overlayClasses['lyrd-overlay-backdrop']?.tailwind ?? '',
  },
  'lyrd-dialog-popup': {
    module: 'Popup',
    tailwind: overlayClasses['lyrd-overlay-popup']?.tailwind ?? '',
  },
  'lyrd-dialog-intro': { module: 'Intro', tailwind: 'flex flex-col gap-1' },
  'lyrd-dialog-title': { module: 'Title', tailwind: 'm-0 text-base font-bold' },
  'lyrd-dialog-description': {
    module: 'Description',
    tailwind: 'm-0 text-sm text-neutral-600 dark:text-neutral-400',
  },
  'lyrd-dialog-content': { module: 'Content', tailwind: 'min-w-0' },
  'lyrd-dialog-actions': { module: 'Actions', tailwind: 'flex justify-end gap-3' },
  'lyrd-dialog-button': {
    module: 'Button',
    tailwind: overlayClasses['lyrd-overlay-button']?.tailwind ?? '',
  },
}

function styleComponent(
  source: string,
  styling: Styling,
  classMap: ClassMap,
  cssFile: string,
): string {
  let output = source
  if (styling === 'css-modules') {
    output = output.replace(
      `import './${cssFile}.css'`,
      `import styles from './${cssFile}.module.css'`,
    )
  } else {
    output = output.replace(`import './${cssFile}.css'\n`, '')
    const styleObject = Object.values(classMap)
      .map(({ module, tailwind }) => {
        const singleQuoted = `'${tailwind.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`
        const doubleQuoted = JSON.stringify(tailwind)
        const value = singleQuoted.length <= doubleQuoted.length ? singleQuoted : doubleQuoted
        return module.length + value.length > 96
          ? `  ${module}:\n    ${value},`
          : `  ${module}: ${value},`
      })
      .join('\n')
    output = output.replace(
      /\n\n(?=(?:export |function |type ))/,
      `\n\nconst styles = {\n${styleObject}\n} as const\n\n`,
    )
    output = output.replace(/\n{3,}/g, '\n\n')
  }

  return output.replace(/className="([^"]+)"/g, (match, names: string) => {
    const entries = names
      .split(' ')
      .map((name) => classMap[name])
      .filter((entry): entry is ClassDefinition => Boolean(entry))
    if (entries.length !== names.split(' ').length) return match
    if (entries.length === 1) return `className={styles.${entries[0]?.module}}`
    return `className={\`${entries.map((entry) => `\${styles.${entry.module}}`).join(' ')}\`}`
  })
}

function cssModule(source: string, classMap: ClassMap): string {
  let output = source
  for (const [original, definition] of Object.entries(classMap).sort(
    ([left], [right]) => right.length - left.length,
  )) {
    output = output.replaceAll(`.${original}`, `.${definition.module}`)
  }
  return output.replaceAll('lyrd-overlay-spin', 'spin')
}
