import type { ReactElement } from 'react'
import type {
  AlertRequest,
  AlertSnapshot,
  ConfirmRequest,
  ConfirmSnapshot,
  DialogOptions,
  DialogSnapshot,
  OverlayApi,
} from './types'

type EntryBase = {
  id: number
  settled: boolean
}

type AlertEntry = EntryBase & {
  kind: 'alert'
  request: AlertRequest
  promise: Promise<void>
  resolve: () => void
}

type ConfirmEntry = EntryBase & {
  kind: 'confirm'
  request: ConfirmRequest
  promise: Promise<boolean>
  resolve: (result: boolean) => void
}

type DialogEntry = EntryBase & {
  kind: 'dialog'
  element: ReactElement
  options: DialogOptions
  promise: Promise<unknown>
  resolve: (result: unknown | undefined) => void
}

type OverlayEntry = AlertEntry | ConfirmEntry | DialogEntry

type IdleControllerSnapshot = {
  kind: null
  open: false
  request: null
  status: 'idle'
  error: null
}

type AlertControllerSnapshot = AlertSnapshot & {
  kind: 'alert'
  request: AlertRequest
  error: null
}

type ConfirmControllerSnapshot = ConfirmSnapshot & {
  kind: 'confirm'
  request: ConfirmRequest
}

type DialogControllerSnapshot = DialogSnapshot & {
  kind: 'dialog'
  element: ReactElement
  options: DialogOptions
  status: Exclude<DialogSnapshot['status'], 'idle'>
}

export type OverlayControllerSnapshot =
  | IdleControllerSnapshot
  | AlertControllerSnapshot
  | ConfirmControllerSnapshot
  | DialogControllerSnapshot

export type OverlayController = {
  overlay: OverlayApi
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => OverlayControllerSnapshot
  openCurrent: () => void
  acknowledgeCurrent: () => void
  confirmCurrent: () => void
  resolveDialogCurrent: (result: unknown) => void
  dismissDialogCurrent: () => void
  cancelCurrent: () => void
  requestClose: () => void
  completeClose: () => void
}

const IDLE_SNAPSHOT: IdleControllerSnapshot = {
  kind: null,
  open: false,
  request: null,
  status: 'idle',
  error: null,
}

export function createOverlayController(): OverlayController {
  let nextId = 1
  let current: OverlayEntry | null = null
  let queue: OverlayEntry[] = []
  let snapshot: OverlayControllerSnapshot = IDLE_SNAPSHOT
  const listeners = new Set<() => void>()

  function publish(next: OverlayControllerSnapshot) {
    snapshot = next
    for (const listener of listeners) listener()
  }

  function getDedupeKey(entry: OverlayEntry): string | undefined {
    return entry.kind === 'dialog' ? undefined : entry.request.dedupeKey
  }

  function findByDedupeKey(
    kind: OverlayEntry['kind'],
    dedupeKey: string,
  ): OverlayEntry | undefined {
    const entries = current ? [current, ...queue] : queue
    return entries.find((entry) => entry.kind === kind && getDedupeKey(entry) === dedupeKey)
  }

  function findMatchingDialog(element: ReactElement): DialogEntry | undefined {
    const entries = current ? [current, ...queue] : queue
    return entries.find(
      (entry): entry is DialogEntry =>
        entry.kind === 'dialog' &&
        entry.element.type === element.type &&
        entry.element.key === element.key,
    )
  }

  function publishEntry(
    entry: OverlayEntry,
    open: boolean,
    status: 'mounting' | 'open' | 'closing',
  ) {
    if (entry.kind === 'alert') {
      publish({ kind: 'alert', open, request: entry.request, status, error: null })
      return
    }
    if (entry.kind === 'dialog') {
      publish({
        kind: 'dialog',
        open,
        request: null,
        element: entry.element,
        options: entry.options,
        status,
      })
      return
    }
    publish({ kind: 'confirm', open, request: entry.request, status, error: null })
  }

  function showNext() {
    current = queue.shift() ?? null
    if (!current) {
      publish(IDLE_SNAPSHOT)
      return
    }
    publishEntry(current, false, 'mounting')
  }

  function openCurrent() {
    if (!current || snapshot.status !== 'mounting') return
    publishEntry(current, true, 'open')
  }

  function settleAlert(entry: AlertEntry) {
    if (entry.settled || current?.id !== entry.id) return
    entry.settled = true
    entry.resolve()
    publishEntry(entry, false, 'closing')
  }

  function settleConfirm(entry: ConfirmEntry, result: boolean) {
    if (entry.settled || current?.id !== entry.id) return
    entry.settled = true
    entry.resolve(result)
    publishEntry(entry, false, 'closing')
  }

  function settleDialog(entry: DialogEntry, result: unknown | undefined) {
    if (entry.settled || current?.id !== entry.id) return
    entry.settled = true
    entry.resolve(result)
    publishEntry(entry, false, 'closing')
  }

  function alert(request: AlertRequest): Promise<void> {
    if (request.dedupeKey) {
      const duplicate = findByDedupeKey('alert', request.dedupeKey)
      if (duplicate) return duplicate.promise as Promise<void>
    }

    let resolve!: () => void
    const promise = new Promise<void>((nextResolve) => {
      resolve = nextResolve
    })
    const entry: AlertEntry = {
      kind: 'alert',
      id: nextId++,
      request,
      promise,
      resolve,
      settled: false,
    }

    queue.push(entry)
    if (!current) showNext()
    return promise
  }

  function confirm(request: ConfirmRequest): Promise<boolean> {
    if (request.dedupeKey) {
      const duplicate = findByDedupeKey('confirm', request.dedupeKey)
      if (duplicate) return duplicate.promise as Promise<boolean>
    }

    let resolve!: (result: boolean) => void
    const promise = new Promise<boolean>((nextResolve) => {
      resolve = nextResolve
    })
    const entry: ConfirmEntry = {
      kind: 'confirm',
      id: nextId++,
      request,
      promise,
      resolve,
      settled: false,
    }

    queue.push(entry)
    if (!current) showNext()
    return promise
  }

  function dialog<Result>(
    element: ReactElement,
    options: DialogOptions = {},
  ): Promise<Result | undefined> {
    const duplicate = findMatchingDialog(element)
    if (duplicate) return duplicate.promise as Promise<Result | undefined>

    let resolve!: (result: Result | undefined) => void
    const promise = new Promise<Result | undefined>((nextResolve) => {
      resolve = nextResolve
    })
    const entry: DialogEntry = {
      kind: 'dialog',
      id: nextId++,
      element,
      options,
      promise,
      resolve: resolve as (result: unknown | undefined) => void,
      settled: false,
    }

    queue.push(entry)
    if (!current) showNext()
    return promise
  }

  function acknowledgeCurrent() {
    if (current?.kind !== 'alert' || snapshot.status !== 'open') return
    settleAlert(current)
  }

  function confirmCurrent() {
    if (current?.kind !== 'confirm' || current.settled) return
    if (snapshot.status !== 'open' && snapshot.status !== 'error') return

    const active = current
    const action = active.request.onConfirm
    if (!action) {
      settleConfirm(active, true)
      return
    }

    publish({
      kind: 'confirm',
      open: true,
      request: active.request,
      status: 'pending',
      error: null,
    })

    void Promise.resolve()
      .then(action)
      .then(
        () => {
          if (current?.id !== active.id || active.settled) return
          settleConfirm(active, true)
        },
        (error: unknown) => {
          if (current?.id !== active.id || active.settled) return
          publish({
            kind: 'confirm',
            open: true,
            request: active.request,
            status: 'error',
            error,
          })
        },
      )
  }

  function cancelCurrent() {
    if (current?.kind !== 'confirm' || current.settled) return
    if (snapshot.status !== 'open' && snapshot.status !== 'error') return
    settleConfirm(current, false)
  }

  function resolveDialogCurrent(result: unknown) {
    if (current?.kind !== 'dialog' || snapshot.status !== 'open') return
    settleDialog(current, result)
  }

  function dismissDialogCurrent() {
    if (current?.kind !== 'dialog' || snapshot.status !== 'open') return
    settleDialog(current, undefined)
  }

  function requestClose() {
    if (!current) return
    if (current.kind === 'alert') {
      acknowledgeCurrent()
      return
    }
    if (current.kind === 'dialog') {
      if (current.options.dismiss === 'block') return
      dismissDialogCurrent()
      return
    }
    if (current.request.dismiss === 'block') return
    cancelCurrent()
  }

  function completeClose() {
    if (!current || snapshot.status !== 'closing') return
    current = null
    showNext()
  }

  function dismissQueuedEntry(entry: OverlayEntry) {
    if (entry.settled) return
    entry.settled = true
    if (entry.kind === 'alert') entry.resolve()
    else if (entry.kind === 'confirm') entry.resolve(false)
    else entry.resolve(undefined)
  }

  function dismissAll() {
    const queued = queue
    queue = []
    for (const entry of queued) dismissQueuedEntry(entry)

    if (snapshot.status === 'mounting' && current) {
      if (current.kind === 'alert') settleAlert(current)
      else if (current.kind === 'confirm') settleConfirm(current, false)
      else settleDialog(current, undefined)
      return
    }

    if (current?.kind === 'alert') acknowledgeCurrent()
    else if (current?.kind === 'confirm') cancelCurrent()
    else dismissDialogCurrent()
  }

  return {
    overlay: { alert, confirm, dialog, dismissAll },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getSnapshot: () => snapshot,
    openCurrent,
    acknowledgeCurrent,
    confirmCurrent,
    resolveDialogCurrent,
    dismissDialogCurrent,
    cancelCurrent,
    requestClose,
    completeClose,
  }
}
