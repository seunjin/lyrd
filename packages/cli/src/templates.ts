function alertTemplate(): string {
  return `'use client'

import { AlertDialog } from '@base-ui/react/alert-dialog'
import type { AlertSurfaceProps } from '@lyrd/core'

import './overlay.css'

export function AlertSurface({
  acknowledge,
  completeClose,
  open,
  request,
  requestClose,
}: AlertSurfaceProps) {
  if (!request) return null

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(nextOpen) => !nextOpen && requestClose()}
      onOpenChangeComplete={(nextOpen) => !nextOpen && completeClose()}
    >
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="lyrd-overlay-backdrop" />
        <AlertDialog.Viewport className="lyrd-overlay-viewport">
          <AlertDialog.Popup className="lyrd-overlay-popup">
            <div className="lyrd-overlay-copy">
              <AlertDialog.Title className="lyrd-overlay-title">{request.title}</AlertDialog.Title>
              {request.description ? (
                <AlertDialog.Description className="lyrd-overlay-description">
                  {request.description}
                </AlertDialog.Description>
              ) : null}
            </div>
            <div className="lyrd-overlay-actions">
              <button
                className="lyrd-overlay-button lyrd-overlay-button-primary"
                onClick={acknowledge}
                type="button"
              >
                {request.acknowledgeLabel ?? '확인'}
              </button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
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

import './overlay.css'

export function ConfirmSurface({
  cancel,
  completeClose,
  confirm,
  open,
  request,
  requestClose,
  status,
}: ConfirmSurfaceProps) {
  if (!request) return null

  const pending = status === 'pending'

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(nextOpen) => !nextOpen && requestClose()}
      onOpenChangeComplete={(nextOpen) => !nextOpen && completeClose()}
    >
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="lyrd-overlay-backdrop" />
        <AlertDialog.Viewport className="lyrd-overlay-viewport">
          <AlertDialog.Popup className="lyrd-overlay-popup">
            <div className="lyrd-overlay-copy">
              <AlertDialog.Title className="lyrd-overlay-title">{request.title}</AlertDialog.Title>
              {request.description ? (
                <AlertDialog.Description className="lyrd-overlay-description">
                  {request.description}
                </AlertDialog.Description>
              ) : null}
              {status === 'error' ? (
                <p className="lyrd-overlay-error" role="alert">
                  작업을 완료하지 못했습니다. 다시 시도해 주세요.
                </p>
              ) : null}
            </div>
            <div className="lyrd-overlay-actions">
              <button
                className="lyrd-overlay-button lyrd-overlay-button-secondary"
                disabled={pending}
                onClick={cancel}
                type="button"
              >
                {request.cancelLabel ?? '취소'}
              </button>
              <button
                aria-busy={pending}
                className="lyrd-overlay-button lyrd-overlay-button-primary"
                data-tone={request.tone ?? 'neutral'}
                disabled={pending}
                onClick={confirm}
                type="button"
              >
                {pending ? <span aria-hidden className="lyrd-overlay-spinner" /> : null}
                {pending ? '처리 중' : request.confirmLabel}
              </button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
`
}

function overlayProviderTemplate(): string {
  return `'use client'

import { OverlayProvider } from '@lyrd/core'
import type { ReactNode } from 'react'

import { AlertSurface } from './alert'
import { ConfirmSurface } from './confirm'

export function AppOverlayProvider({ children }: { children: ReactNode }) {
  return (
    <OverlayProvider renderers={{ alert: AlertSurface, confirm: ConfirmSurface }}>
      {children}
    </OverlayProvider>
  )
}
`
}

function overlayCssTemplate(): string {
  return `.lyrd-overlay-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgb(15 23 42 / 45%);
  transition: opacity 160ms ease;
}

.lyrd-overlay-backdrop[data-starting-style],
.lyrd-overlay-backdrop[data-ending-style] {
  opacity: 0;
}

.lyrd-overlay-viewport {
  position: fixed;
  inset: 0;
  z-index: 2001;
  display: grid;
  place-items: center;
  padding: 24px;
}

.lyrd-overlay-popup {
  display: grid;
  width: min(420px, 100%);
  gap: 24px;
  padding: 24px;
  border: 1px solid #e4e4e7;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 24px 64px rgb(15 23 42 / 22%);
  transform: translateY(0) scale(1);
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.lyrd-overlay-popup[data-starting-style],
.lyrd-overlay-popup[data-ending-style] {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

.lyrd-overlay-copy {
  display: grid;
  gap: 8px;
}

.lyrd-overlay-title,
.lyrd-overlay-description,
.lyrd-overlay-error {
  margin: 0;
}

.lyrd-overlay-title {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.4;
}

.lyrd-overlay-description {
  color: #64748b;
  line-height: 1.6;
}

.lyrd-overlay-error {
  color: #dc2626;
  font-size: 13px;
}

.lyrd-overlay-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.lyrd-overlay-button {
  display: inline-flex;
  min-width: 72px;
  height: 38px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 0 14px;
  font-weight: 600;
  cursor: pointer;
}

.lyrd-overlay-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.lyrd-overlay-button-secondary {
  border-color: #d4d4d8;
  color: #27272a;
  background: #fff;
}

.lyrd-overlay-button-primary {
  color: #fff;
  background: #18181b;
}

.lyrd-overlay-button-primary[data-tone="danger"] {
  background: #dc2626;
}

.lyrd-overlay-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgb(255 255 255 / 45%);
  border-top-color: #fff;
  border-radius: 999px;
  animation: lyrd-overlay-spin 700ms linear infinite;
}

@keyframes lyrd-overlay-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .lyrd-overlay-backdrop,
  .lyrd-overlay-popup {
    transition-duration: 1ms;
  }

  .lyrd-overlay-spinner {
    animation-duration: 1400ms;
  }
}
`
}

export function getOverlayScaffoldFiles(): Array<{ name: string; content: string }> {
  return [
    { name: 'alert.tsx', content: alertTemplate() },
    { name: 'confirm.tsx', content: confirmTemplate() },
    { name: 'overlay-provider.tsx', content: overlayProviderTemplate() },
    { name: 'overlay.css', content: overlayCssTemplate() },
  ]
}

export function getNextAppRouterProviderTemplate(providerImportPath: string): string {
  return `'use client'

import type { ReactNode } from 'react'

import { AppOverlayProvider } from '${providerImportPath}'

export function LyrdOverlayProvider({ children }: { children: ReactNode }) {
  return <AppOverlayProvider>{children}</AppOverlayProvider>
}
`
}

function toastGroupTemplate(): string {
  return `import { defineOverlayGroup } from '@lyrd/core'

export const toastGroup = defineOverlayGroup({ strategy: 'parallel' })
`
}

function toastTemplate(): string {
  return `'use client'

import { Toast } from '@base-ui/react/toast'
import { defineOverlay } from '@lyrd/core'
import type { OverlayDefinitionComponentProps } from '@lyrd/core'
import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'

import './toast.css'

export type AppToastInput = {
  description?: string
  timeout?: number
  title: string
  toastId: string
}

export type AppToastResult =
  | { action: 'undo' }
  | { action: 'dismissed' }

type AppToastData = {
  dismiss: () => void
  undo: () => void
}

type AppToastProps = OverlayDefinitionComponentProps<AppToastInput, AppToastResult>

function AppToast({ input, session }: AppToastProps) {
  const { add, close } = Toast.useToastManager<AppToastData>()
  const inputRef = useRef(input)
  const sessionRef = useRef(session)
  const addedRef = useRef(false)

  inputRef.current = input
  sessionRef.current = session

  useEffect(() => {
    if (!session.open) {
      if (addedRef.current) {
        close(input.toastId)
      }
      return
    }

    if (addedRef.current) return

    addedRef.current = true
    const currentInput = inputRef.current

    add({
      id: currentInput.toastId,
      title: currentInput.title,
      description: currentInput.description,
      timeout: currentInput.timeout,
      data: {
        undo: () => sessionRef.current.resolve({ action: 'undo' }),
        dismiss: () => sessionRef.current.resolve({ action: 'dismissed' }),
      },
      onClose: () => sessionRef.current.resolve({ action: 'dismissed' }),
      onRemove: () => sessionRef.current.completeClose(),
    })
  }, [add, close, input.toastId, session.open])

  return null
}

export const appToast = defineOverlay(AppToast)

function ToastRegion() {
  const { toasts } = Toast.useToastManager<AppToastData>()

  return (
    <Toast.Portal>
      <Toast.Viewport aria-label="알림" className="lyrd-toast-viewport">
        {toasts.map((toast) => (
          <Toast.Root className="lyrd-toast" key={toast.id} toast={toast}>
            <Toast.Content className="lyrd-toast-content">
              <Toast.Title className="lyrd-toast-title" />
              <Toast.Description className="lyrd-toast-description" />
            </Toast.Content>
            <div className="lyrd-toast-actions">
              <Toast.Action className="lyrd-toast-undo" onClick={toast.data?.undo}>
                실행 취소
              </Toast.Action>
              <Toast.Close className="lyrd-toast-close" onClickCapture={toast.data?.dismiss}>
                닫기
              </Toast.Close>
            </div>
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  )
}

export function AppToastProvider({ children }: { children: ReactNode }) {
  return (
    <Toast.Provider limit={5} timeout={5000}>
      {children}
      <ToastRegion />
    </Toast.Provider>
  )
}
`
}

function toastCssTemplate(): string {
  return `.lyrd-toast-viewport {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 3000;
  display: grid;
  width: min(380px, calc(100vw - 40px));
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.lyrd-toast {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  color: #0f172a;
  background: #fff;
  box-shadow: 0 12px 32px rgb(15 23 42 / 18%);
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.lyrd-toast[data-starting-style],
.lyrd-toast[data-ending-style] {
  opacity: 0;
  transform: translateY(8px);
}

.lyrd-toast-content {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.lyrd-toast-title,
.lyrd-toast-description {
  margin: 0;
}

.lyrd-toast-title {
  font-size: 14px;
  font-weight: 700;
}

.lyrd-toast-description {
  color: #64748b;
  font-size: 13px;
  line-height: 1.45;
}

.lyrd-toast-actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
}

.lyrd-toast-undo,
.lyrd-toast-close {
  border: 0;
  border-radius: 7px;
  padding: 6px 8px;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.lyrd-toast-undo {
  color: #fff;
  background: #0f172a;
}

.lyrd-toast-close {
  color: #475569;
  background: #f1f5f9;
}

@media (prefers-reduced-motion: reduce) {
  .lyrd-toast {
    transition-duration: 1ms;
  }
}
`
}

export function getToastScaffoldFiles(): Array<{ name: string; content: string }> {
  return [
    { name: 'toast.tsx', content: toastTemplate() },
    { name: 'toast-group.ts', content: toastGroupTemplate() },
    { name: 'toast.css', content: toastCssTemplate() },
  ]
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
import { defineOverlay } from '@lyrd/core'
import type { OverlayDefinitionComponentProps } from '@lyrd/core'
import type { ReactNode } from 'react'

import './dialog.css'

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
        session.requestClose(eventDetails.reason === 'escape-key' ? 'escape' : 'outside')
      }
      onOpenChangeComplete={(nextOpen) => !nextOpen && session.completeClose()}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="lyrd-dialog-backdrop" />
        <Dialog.Viewport className="lyrd-dialog-viewport">
          <Dialog.Popup className="lyrd-dialog-popup">
            <header className="lyrd-dialog-header">
              <div>
                <Dialog.Title className="lyrd-dialog-title">{title}</Dialog.Title>
                <Dialog.Description className="lyrd-dialog-description">
                  {description}
                </Dialog.Description>
              </div>
            </header>

            {children ? <div className="lyrd-dialog-content">{children}</div> : null}

            <footer className="lyrd-dialog-actions">
              <button
                className="lyrd-dialog-button-secondary"
                onClick={() => session.dismiss('cancel')}
                type="button"
              >
                취소
              </button>
              <button
                className="lyrd-dialog-button-primary"
                onClick={() => session.resolve({ completed: true })}
                type="button"
              >
                완료
              </button>
            </footer>
          </Dialog.Popup>
        </Dialog.Viewport>
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
  inset: 0;
  z-index: 2100;
  background: rgb(15 23 42 / 52%);
  transition: opacity 180ms ease;
}

.lyrd-dialog-backdrop[data-starting-style],
.lyrd-dialog-backdrop[data-ending-style] {
  opacity: 0;
}

.lyrd-dialog-viewport {
  position: fixed;
  inset: 0;
  z-index: 2101;
  display: grid;
  place-items: center;
  padding: 24px;
}

.lyrd-dialog-popup {
  display: grid;
  width: min(520px, 100%);
  gap: 24px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 28px 80px rgb(15 23 42 / 28%);
  transform: translateY(0) scale(1);
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.lyrd-dialog-popup[data-starting-style],
.lyrd-dialog-popup[data-ending-style] {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

.lyrd-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.lyrd-dialog-title,
.lyrd-dialog-description {
  margin: 0;
}

.lyrd-dialog-title {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.35;
}

.lyrd-dialog-description {
  margin-top: 6px;
  color: #64748b;
  line-height: 1.5;
}

.lyrd-dialog-content {
  min-width: 0;
}

.lyrd-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.lyrd-dialog-button-primary,
.lyrd-dialog-button-secondary {
  min-height: 38px;
  border: 1px solid transparent;
  border-radius: 9px;
  padding: 0 14px;
  font-weight: 600;
  cursor: pointer;
}

.lyrd-dialog-button-primary {
  color: #fff;
  background: #0f172a;
}

.lyrd-dialog-button-secondary {
  border-color: #cbd5e1;
  color: #334155;
  background: #fff;
}

@media (prefers-reduced-motion: reduce) {
  .lyrd-dialog-backdrop,
  .lyrd-dialog-popup {
    transition-duration: 1ms;
  }
}
`
}

export function getDialogScaffoldFiles(
  dialogName: string,
): Array<{ name: string; content: string }> {
  return [
    { name: `${dialogName}-dialog.tsx`, content: dialogComponentTemplate(dialogName) },
    { name: 'dialog.css', content: dialogCssTemplate() },
  ]
}
