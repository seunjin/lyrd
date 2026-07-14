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
