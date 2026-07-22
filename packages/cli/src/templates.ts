import type { Styling } from './types'

function alertTemplate(): string {
  return `'use client'

import { AlertDialog } from '@base-ui/react/alert-dialog'
import type { AlertSurfaceProps } from '@lyrd/core'

import './Alert.css'

export function AlertSurface({
  acknowledge,
  completeExit,
  open,
  request,
  requestDismiss,
}: AlertSurfaceProps) {
  if (!request) return null

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(nextOpen) => !nextOpen && requestDismiss()}
      onOpenChangeComplete={(nextOpen) => !nextOpen && completeExit()}
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
          </div>
          <div className="lyrd-overlay-actions">
            <button className="lyrd-overlay-button" onClick={acknowledge} type="button">
              {request.acknowledgeLabel ?? '확인'}
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
import type { ConfirmSurfaceProps } from '@lyrd/core'

import './Confirm.css'

export function ConfirmSurface({
  cancel,
  completeExit,
  confirm,
  open,
  request,
  requestDismiss,
  status,
}: ConfirmSurfaceProps) {
  if (!request) return null

  const pending = status === 'pending'

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(nextOpen) => !nextOpen && requestDismiss()}
      onOpenChangeComplete={(nextOpen) => !nextOpen && completeExit()}
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
            {status === 'error' ? (
              <p className="lyrd-overlay-description" role="alert">
                작업을 완료하지 못했습니다. 다시 시도해 주세요.
              </p>
            ) : null}
          </div>
          <div className="lyrd-overlay-actions">
            <button className="lyrd-overlay-button" disabled={pending} onClick={cancel} type="button">
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
              {pending ? '처리 중' : request.confirmLabel}
            </button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
`
}

function overlayProviderTemplate(): string {
  return `'use client'

import { OverlayProvider as CoreOverlayProvider } from '@lyrd/core'
import type { ReactNode } from 'react'

import { AlertSurface } from './alert/AlertSurface'
import { ConfirmSurface } from './confirm/ConfirmSurface'

export function OverlayProvider({ children }: { children: ReactNode }) {
  return (
    <CoreOverlayProvider renderers={{ alert: AlertSurface, confirm: ConfirmSurface }}>
      {children}
    </CoreOverlayProvider>
  )
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

function toastDefinitionTemplate(): string {
  return `import type { OverlayDefinitionComponentProps } from '@lyrd/core'
import { defineOverlay } from '@lyrd/core'
import { useEffect, useRef } from 'react'

import { appToastManager } from './manager'

export type AppToastInput = {
  actionLabel?: string
  description?: string
  timeout?: number
  title: string
  toastId: string
}

export type AppToastResult = { action: 'undo' }

type AppToastProps = OverlayDefinitionComponentProps<AppToastInput, AppToastResult>

function AppToast({ input, session }: AppToastProps) {
  const inputRef = useRef(input)
  const sessionRef = useRef(session)
  const addedRef = useRef(false)

  inputRef.current = input
  sessionRef.current = session

  useEffect(() => {
    if (!session.open) {
      if (addedRef.current) {
        appToastManager.close(input.toastId)
      }
      return
    }

    if (addedRef.current) return

    addedRef.current = true
    const currentInput = inputRef.current

    appToastManager.add({
      id: currentInput.toastId,
      title: currentInput.title,
      description: currentInput.description,
      timeout: currentInput.timeout,
      data: currentInput.actionLabel
        ? {
            undo: () => sessionRef.current.resolve({ action: 'undo' }),
            undoLabel: currentInput.actionLabel,
            dismiss: () => sessionRef.current.dismiss('cancel'),
          }
        : {
            dismiss: () => sessionRef.current.dismiss('cancel'),
          },
      onClose: () => sessionRef.current.dismiss('programmatic'),
      onRemove: () => sessionRef.current.completeExit(),
    })
  }, [input.toastId, session.open])

  return null
}

export const appToast = defineOverlay(AppToast)
`
}

function toastTemplate(): string {
  return `'use client'

import { Toast } from '@base-ui/react/toast'
import { type AppToastData, appToastManager } from './manager'
import './Toast.css'

function ToastRegion() {
  const { toasts } = Toast.useToastManager<AppToastData>()

  return (
    <Toast.Portal>
      <Toast.Viewport aria-label="알림" className="lyrd-toast-viewport">
        {toasts.map((toast) => (
          <Toast.Root className="lyrd-toast" key={toast.id} toast={toast}>
            <Toast.Content className="lyrd-toast-content">
              <div className="lyrd-toast-text">
                <Toast.Title className="lyrd-toast-title" />
                <Toast.Description className="lyrd-toast-description" />
              </div>
              {toast.data?.undo ? (
                <Toast.Action className="lyrd-toast-close" onClick={toast.data.undo}>
                  {toast.data.undoLabel}
                </Toast.Action>
              ) : null}
              <Toast.Close className="lyrd-toast-close" onClickCapture={toast.data?.dismiss}>
                닫기
              </Toast.Close>
            </Toast.Content>
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  )
}

export function AppToastProvider() {
  return (
    <Toast.Provider toastManager={appToastManager} timeout={5000}>
      <ToastRegion />
    </Toast.Provider>
  )
}
`
}

function toastManagerTemplate(): string {
  return `import { Toast } from '@base-ui/react/toast'

export type AppToastData = {
  dismiss: () => void
  undo?: () => void
  undoLabel?: string
}

export const appToastManager = Toast.createToastManager<AppToastData>()
`
}

function toastNotifyTemplate(): string {
  return `import type { OverlayApi } from '@lyrd/core'
import { defineOverlayGroup } from '@lyrd/core'

import type { AppToastInput } from './definition'
import { appToast } from './definition'

export const toastGroup = defineOverlayGroup({ strategy: 'parallel' })

type ToastMessage = Omit<AppToastInput, 'actionLabel' | 'toastId'>

export function showToast(overlay: OverlayApi, input: ToastMessage) {
  return overlay.open(
    appToast,
    {
      ...input,
      toastId: crypto.randomUUID(),
    },
    { group: toastGroup },
  )
}

export function notify(overlay: OverlayApi, input: ToastMessage): void {
  void showToast(overlay, input)
}

export async function notifyWithUndo(
  overlay: OverlayApi,
  input: ToastMessage,
): Promise<'dismissed' | 'undo'> {
  const outcome = await overlay.open(
    appToast,
    {
      ...input,
      actionLabel: '실행 취소',
      toastId: crypto.randomUUID(),
    },
    { group: toastGroup },
  )

  return outcome.status === 'resolved' ? outcome.value.action : 'dismissed'
}
`
}

function toastCssTemplate(): string {
  return `.lyrd-toast-viewport {
  position: fixed;
  z-index: 1;
  width: calc(100vw - 2rem);
  margin: 0 auto;
  bottom: 1rem;
  right: 1rem;
  left: auto;
  top: auto;
}

@media (min-width: 500px) {
  .lyrd-toast-viewport {
    bottom: 2rem;
    right: 2rem;
    width: 22.5rem;
  }
}

.lyrd-toast {
  --gap: 0.75rem;
  --peek: 0.75rem;
  --scale: calc(max(0, 1 - (var(--toast-index) * 0.1)));
  --shrink: calc(1 - var(--scale));
  --height: var(--toast-frontmost-height, var(--toast-height));
  --offset-y: calc(
    var(--toast-offset-y) *
    -1 +
    (var(--toast-index) * var(--gap) * -1) +
    var(--toast-swipe-movement-y)
  );
  position: absolute;
  right: 0;
  bottom: 0;
  left: auto;
  z-index: calc(1000 - var(--toast-index));
  box-sizing: border-box;
  width: 100%;
  height: var(--height);
  margin: 0 auto;
  margin-right: 0;
  border: 1px solid oklch(14.5% 0 0deg);
  background-color: white;
  color: oklch(14.5% 0 0deg);
  box-shadow: 0.25rem 0.25rem 0 rgb(0 0 0 / 12%);
  transform-origin: bottom center;
  -webkit-user-select: none;
  user-select: none;
  transition:
    transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.5s,
    height 0.15s;
  cursor: default;
  transform: translateX(var(--toast-swipe-movement-x))
    translateY(
      calc(
        var(--toast-swipe-movement-y) -
        (var(--toast-index) * var(--peek)) -
        (var(--shrink) * var(--height))
      )
    )
    scale(var(--scale));
}

.lyrd-toast[data-expanded] {
  height: var(--toast-height);
  transform: translateX(var(--toast-swipe-movement-x)) translateY(var(--offset-y));
}

.lyrd-toast[data-starting-style],
.lyrd-toast[data-ending-style] {
  transform: translateY(150%);
}

.lyrd-toast[data-limited] {
  opacity: 0;
}

.lyrd-toast[data-ending-style] {
  opacity: 0;
}

.lyrd-toast[data-ending-style][data-swipe-direction="up"] {
  transform: translateY(calc(var(--toast-swipe-movement-y) - 150%));
}

.lyrd-toast[data-ending-style][data-swipe-direction="down"] {
  transform: translateY(calc(var(--toast-swipe-movement-y) + 150%));
}

.lyrd-toast[data-ending-style][data-swipe-direction="left"] {
  transform: translateX(calc(var(--toast-swipe-movement-x) - 150%)) translateY(var(--offset-y));
}

.lyrd-toast[data-ending-style][data-swipe-direction="right"] {
  transform: translateX(calc(var(--toast-swipe-movement-x) + 150%)) translateY(var(--offset-y));
}

.lyrd-toast::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  height: calc(var(--gap) + 1px);
}

.lyrd-toast:focus-visible {
  outline: 2px solid oklch(14.5% 0 0deg);
  outline-offset: -1px;
}

.lyrd-toast-content {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 1rem;
  height: 100%;
  padding: 0.75rem;
  overflow: hidden;
  transition: opacity 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}

.lyrd-toast-content[data-behind] {
  opacity: 0;
}

.lyrd-toast-content[data-expanded] {
  opacity: 1;
}

.lyrd-toast-text {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 0.25rem;
}

.lyrd-toast-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1.25rem;
}

.lyrd-toast-description {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.lyrd-toast-close {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 2rem;
  padding: 0 0.75rem;
  border: 1px solid oklch(14.5% 0 0deg);
  border-radius: 0;
  background-color: white;
  color: oklch(14.5% 0 0deg);
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1;
  white-space: nowrap;
}

@media (hover: hover) {
  .lyrd-toast-close:hover:not([data-disabled]) {
    background-color: oklch(97% 0 0deg);
  }
}

.lyrd-toast-close:active:not([data-disabled]) {
  background-color: oklch(92.2% 0 0deg);
}

.lyrd-toast-close:focus-visible {
  outline: 2px solid oklch(14.5% 0 0deg);
  outline-offset: -1px;
}

@media (prefers-color-scheme: dark) {
  .lyrd-toast {
    border-color: white;
    background-color: oklch(14.5% 0 0deg);
    color: white;
    box-shadow: none;
  }

  .lyrd-toast-close {
    border-color: white;
    background-color: oklch(14.5% 0 0deg);
    color: white;
  }

  .lyrd-toast:focus-visible,
  .lyrd-toast-close:focus-visible {
    outline-color: white;
  }

  .lyrd-toast-close:hover:not([data-disabled]) {
    background-color: oklch(26.9% 0 0deg);
  }

  .lyrd-toast-close:active:not([data-disabled]) {
    background-color: oklch(37.1% 0 0deg);
  }
}
`
}

export function getToastScaffoldFiles(styling: Styling): Array<{ name: string; content: string }> {
  const files = [
    { name: 'toast/definition.ts', content: toastDefinitionTemplate() },
    { name: 'toast/manager.ts', content: toastManagerTemplate() },
    {
      name: 'toast/AppToastProvider.tsx',
      content: styleComponent(toastTemplate(), styling, toastClasses, 'Toast'),
    },
    { name: 'toast/notify.ts', content: toastNotifyTemplate() },
  ]
  if (styling === 'css-modules') {
    files.push({
      name: 'toast/Toast.module.css',
      content: cssModule(toastCssTemplate(), toastClasses),
    })
  }
  return files
}

function dialogComponentTemplate(dialogName: string): string {
  const componentName = dialogName
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('')
  const definitionName = `${componentName.charAt(0).toLowerCase()}${componentName.slice(1)}Dialog`
  const title = dialogName.replaceAll('-', ' ')

  return `'use client'

import { Dialog } from '@base-ui/react/dialog'
import type { OverlayDefinitionComponentProps } from '@lyrd/core'
import { defineOverlay } from '@lyrd/core'
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

type ${componentName}DialogComponentProps = OverlayDefinitionComponentProps<
  ${componentName}DialogProps,
  ${componentName}DialogResult
>

function ${componentName}Dialog({ input, session }: ${componentName}DialogComponentProps) {
  const {
    children,
    description = '이 설명과 화면 내용을 제품 흐름에 맞게 수정하세요.',
    title = '${title}',
  } = input

  return (
    <Dialog.Root
      open={session.open}
      onOpenChange={(nextOpen, eventDetails) =>
        !nextOpen &&
        session.requestDismiss(eventDetails.reason === 'escape-key' ? 'escape' : 'outside')
      }
      onOpenChangeComplete={(nextOpen) => !nextOpen && session.completeExit()}
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
              onClick={() => session.dismiss('cancel')}
              type="button"
            >
              취소
            </button>
            <button
              className="lyrd-dialog-button"
              onClick={() => session.resolve({ completed: true })}
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

export const ${definitionName} = defineOverlay(${componentName}Dialog)
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
      'fixed inset-0 min-h-dvh bg-black opacity-20 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 dark:opacity-50 supports-[-webkit-touch-callout:none]:absolute',
  },
  'lyrd-overlay-popup': {
    module: 'Popup',
    tailwind:
      'fixed top-1/2 left-1/2 -mt-8 flex w-96 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 border border-neutral-950 bg-white p-4 text-neutral-950 shadow-[0.25rem_0.25rem_0] shadow-black/12 transition-[scale,opacity] duration-100 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none',
  },
  'lyrd-overlay-intro': { module: 'Intro', tailwind: 'flex flex-col gap-1' },
  'lyrd-overlay-title': { module: 'Title', tailwind: 'm-0 text-base font-bold' },
  'lyrd-overlay-description': {
    module: 'Description',
    tailwind: 'm-0 text-sm text-neutral-600 dark:text-neutral-400',
  },
  'lyrd-overlay-actions': { module: 'Actions', tailwind: 'flex justify-end gap-3' },
  'lyrd-overlay-button': {
    module: 'Button',
    tailwind:
      'flex h-8 items-center justify-center gap-2 border border-neutral-950 bg-white px-3 text-sm leading-none whitespace-nowrap font-normal text-neutral-950 select-none hover:not-data-disabled:bg-neutral-100 active:not-data-disabled:bg-neutral-200 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:not-data-disabled:bg-neutral-800 dark:active:not-data-disabled:bg-neutral-700 data-[color=red]:text-red-700 dark:data-[color=red]:text-red-400 disabled:border-neutral-500 disabled:text-neutral-500 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white',
  },
}

const toastClasses: ClassMap = {
  'lyrd-toast-viewport': {
    module: 'Viewport',
    tailwind:
      'fixed top-auto right-[1rem] bottom-[1rem] z-1 mx-auto w-[calc(100vw-2rem)] sm:right-[2rem] sm:bottom-[2rem] sm:w-[22.5rem]',
  },
  'lyrd-toast': {
    module: 'Toast',
    tailwind:
      "[--gap:0.75rem] [--peek:0.75rem] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)*-1+calc(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-movement-y))] absolute right-0 bottom-0 left-auto z-[calc(1000-var(--toast-index))] mr-0 w-full origin-bottom [transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-(var(--toast-index)*var(--peek))-(var(--shrink)*var(--height))))_scale(var(--scale))] border border-neutral-950 bg-white text-neutral-950 shadow-[0.25rem_0.25rem_0] shadow-black/12 select-none dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-[''] data-ending-style:opacity-0 data-expanded:[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--offset-y)))] data-limited:opacity-0 data-starting-style:[transform:translateY(150%)] h-[var(--height)] data-expanded:h-[var(--toast-height)] [transition:transform_0.5s_cubic-bezier(0.22,1,0.36,1),opacity_0.5s,height_0.15s]",
  },
  'lyrd-toast-content': {
    module: 'Content',
    tailwind:
      'flex h-full items-center gap-4 overflow-hidden p-3 transition-opacity duration-[250ms] data-behind:opacity-0 data-expanded:opacity-100',
  },
  'lyrd-toast-text': { module: 'Text', tailwind: 'flex min-w-0 flex-1 flex-col gap-1' },
  'lyrd-toast-title': { module: 'Title', tailwind: 'm-0 text-sm font-bold' },
  'lyrd-toast-description': {
    module: 'Description',
    tailwind: 'm-0 text-sm',
  },
  'lyrd-toast-close': {
    module: 'Close',
    tailwind:
      'flex h-8 shrink-0 items-center justify-center gap-2 border border-neutral-950 bg-white px-3 text-sm leading-none whitespace-nowrap font-normal text-neutral-950 hover:not-data-disabled:bg-neutral-100 active:not-data-disabled:bg-neutral-200 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:not-data-disabled:bg-neutral-800 dark:active:not-data-disabled:bg-neutral-700 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white',
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
