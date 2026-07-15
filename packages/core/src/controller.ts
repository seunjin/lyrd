import type { ReactElement } from 'react'
import type {
  AlertRequest,
  AlertSnapshot,
  ConfirmRequest,
  ConfirmSnapshot,
  DialogOptions,
  DialogSnapshot,
  OverlayApi,
  OverlayDefinition,
  OverlayDismissReason,
  OverlayOpenOptions,
  OverlayOutcome,
} from './types'

type AnyOverlayDefinition = OverlayDefinition<unknown, unknown>

type Deferred<Result> = {
  promise: Promise<Result>
  resolve: (result: Result) => void
}

type SessionEntry<Kind extends string, Result> = Deferred<Result> & {
  kind: Kind
  id: number
  settled: boolean
}

type AlertEntry = SessionEntry<'alert', void> & {
  request: AlertRequest
}

type ConfirmEntry = SessionEntry<'confirm', boolean> & {
  request: ConfirmRequest
}

type DialogEntry = SessionEntry<'dialog', unknown | undefined> & {
  element: ReactElement
  options: DialogOptions
}

type DefinitionEntry = SessionEntry<'definition', OverlayOutcome<unknown>> & {
  definition: AnyOverlayDefinition
  input: unknown
  options: OverlayOpenOptions
}

type OverlayEntry = AlertEntry | ConfirmEntry | DialogEntry | DefinitionEntry

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

type DefinitionControllerSnapshot = {
  kind: 'definition'
  open: boolean
  request: null
  definition: AnyOverlayDefinition
  input: unknown
  options: OverlayOpenOptions
  status: Exclude<DialogSnapshot['status'], 'idle'>
}

export type OverlayControllerSnapshot =
  | IdleControllerSnapshot
  | AlertControllerSnapshot
  | ConfirmControllerSnapshot
  | DialogControllerSnapshot
  | DefinitionControllerSnapshot

export type OverlayController = {
  overlay: OverlayApi
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => OverlayControllerSnapshot
  openCurrent: () => void
  acknowledgeCurrent: () => void
  confirmCurrent: () => void
  resolveDialogCurrent: (result: unknown) => void
  dismissDialogCurrent: () => void
  resolveDefinitionCurrent: (result: unknown) => void
  dismissDefinitionCurrent: (reason: OverlayDismissReason) => void
  cancelCurrent: () => void
  requestClose: (reason?: OverlayDismissReason) => void
  completeClose: () => void
}

const IDLE_SNAPSHOT: IdleControllerSnapshot = {
  kind: null,
  open: false,
  request: null,
  status: 'idle',
  error: null,
}

function createDeferred<Result>(): Deferred<Result> {
  let resolve!: (result: Result) => void
  const promise = new Promise<Result>((nextResolve) => {
    resolve = nextResolve
  })
  return { promise, resolve }
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

  function createSessionEntry<Kind extends OverlayEntry['kind'], Result>(
    kind: Kind,
    deferred: Deferred<Result>,
  ): SessionEntry<Kind, Result> {
    return {
      kind,
      id: nextId++,
      settled: false,
      ...deferred,
    }
  }

  function getDedupeKey(entry: OverlayEntry): string | undefined {
    return entry.kind === 'alert' || entry.kind === 'confirm' ? entry.request.dedupeKey : undefined
  }

  function findByDedupeKey(
    kind: OverlayEntry['kind'],
    dedupeKey: string,
  ): OverlayEntry | undefined {
    const entries = current ? [current, ...queue] : queue
    return entries.find((entry) => entry.kind === kind && getDedupeKey(entry) === dedupeKey)
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
    if (entry.kind === 'definition') {
      publish({
        kind: 'definition',
        open,
        request: null,
        definition: entry.definition,
        input: entry.input,
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

  function enqueueEntry(entry: OverlayEntry) {
    queue.push(entry)
    if (!current) showNext()
  }

  function openCurrent() {
    if (!current || snapshot.status !== 'mounting') return
    publishEntry(current, true, 'open')
  }

  function settleEntry(entry: OverlayEntry, resolve: () => void) {
    if (entry.settled || current?.id !== entry.id) return
    entry.settled = true
    resolve()
    publishEntry(entry, false, 'closing')
  }

  function settleAlert(entry: AlertEntry) {
    settleEntry(entry, () => entry.resolve())
  }

  function settleConfirm(entry: ConfirmEntry, result: boolean) {
    settleEntry(entry, () => entry.resolve(result))
  }

  function settleDialog(entry: DialogEntry, result: unknown | undefined) {
    settleEntry(entry, () => entry.resolve(result))
  }

  function settleDefinition(entry: DefinitionEntry, outcome: OverlayOutcome<unknown>) {
    settleEntry(entry, () => entry.resolve(outcome))
  }

  function alert(request: AlertRequest): Promise<void> {
    if (request.dedupeKey) {
      const duplicate = findByDedupeKey('alert', request.dedupeKey)
      if (duplicate) return duplicate.promise as Promise<void>
    }

    const entry: AlertEntry = {
      ...createSessionEntry('alert', createDeferred<void>()),
      request,
    }

    enqueueEntry(entry)
    return entry.promise
  }

  function confirm(request: ConfirmRequest): Promise<boolean> {
    if (request.dedupeKey) {
      const duplicate = findByDedupeKey('confirm', request.dedupeKey)
      if (duplicate) return duplicate.promise as Promise<boolean>
    }

    const entry: ConfirmEntry = {
      ...createSessionEntry('confirm', createDeferred<boolean>()),
      request,
    }

    enqueueEntry(entry)
    return entry.promise
  }

  function dialog<Result>(
    element: ReactElement,
    options: DialogOptions = {},
  ): Promise<Result | undefined> {
    const entry: DialogEntry = {
      ...createSessionEntry('dialog', createDeferred<unknown | undefined>()),
      element,
      options,
    }

    enqueueEntry(entry)
    return entry.promise as Promise<Result | undefined>
  }

  function open<Input, Result>(
    definition: OverlayDefinition<Input, Result>,
    input: Input,
    options: OverlayOpenOptions = {},
  ): Promise<OverlayOutcome<Result>> {
    const entry: DefinitionEntry = {
      ...createSessionEntry('definition', createDeferred<OverlayOutcome<unknown>>()),
      definition: definition as unknown as AnyOverlayDefinition,
      input,
      options,
    }

    enqueueEntry(entry)
    return entry.promise as Promise<OverlayOutcome<Result>>
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

  function resolveDefinitionCurrent(result: unknown) {
    if (current?.kind !== 'definition' || snapshot.status !== 'open') return
    settleDefinition(current, { status: 'resolved', value: result })
  }

  function dismissDefinitionCurrent(reason: OverlayDismissReason) {
    if (current?.kind !== 'definition' || snapshot.status !== 'open') return
    settleDefinition(current, { status: 'dismissed', reason })
  }

  function requestClose(reason: OverlayDismissReason = 'programmatic') {
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
    if (current.kind === 'definition') {
      if (current.options.dismiss === 'block') return
      dismissDefinitionCurrent(reason)
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

  function dismissQueuedEntry(
    entry: OverlayEntry,
    reason: Extract<OverlayDismissReason, 'route-change' | 'programmatic'>,
  ) {
    if (entry.settled) return
    entry.settled = true
    if (entry.kind === 'alert') entry.resolve()
    else if (entry.kind === 'confirm') entry.resolve(false)
    else if (entry.kind === 'dialog') entry.resolve(undefined)
    else entry.resolve({ status: 'dismissed', reason })
  }

  function dismissAll(
    reason: Extract<OverlayDismissReason, 'route-change' | 'programmatic'> = 'programmatic',
  ) {
    const queued = queue
    queue = []
    for (const entry of queued) dismissQueuedEntry(entry, reason)

    if (snapshot.status === 'mounting' && current) {
      if (current.kind === 'alert') settleAlert(current)
      else if (current.kind === 'confirm') settleConfirm(current, false)
      else if (current.kind === 'dialog') settleDialog(current, undefined)
      else settleDefinition(current, { status: 'dismissed', reason })
      return
    }

    if (current?.kind === 'alert') acknowledgeCurrent()
    else if (current?.kind === 'confirm') cancelCurrent()
    else if (current?.kind === 'dialog') dismissDialogCurrent()
    else if (current?.kind === 'definition') dismissDefinitionCurrent(reason)
  }

  return {
    overlay: { alert, confirm, dialog, open, dismissAll },
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
    resolveDefinitionCurrent,
    dismissDefinitionCurrent,
    cancelCurrent,
    requestClose,
    completeClose,
  }
}
