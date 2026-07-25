import type {
  OverlayCloseReason,
  OverlayCloseRequestReason,
  OverlayHandle,
  OverlayPhase,
} from './contract'

export type OverlayRuntimeSessionSnapshot<Kind extends string = string, Payload = unknown> = {
  id: number
  kind: Kind
  open: boolean
  phase: OverlayPhase
  payload: Payload
}

export type CreateOverlayRuntimeSessionOptions<Kind extends string, Payload, Value> = {
  kind: Kind
  payload: Payload
  closeValue(reason: OverlayCloseReason): Value
  closeOnEscape?: boolean
  closeOnOutsidePress?: boolean
}

export type CreatedOverlayRuntimeSession<Value> = {
  id: number
  handle: OverlayHandle<Value>
}

export type OverlayRuntime = {
  createSession<Kind extends string, Payload, Value>(
    options: CreateOverlayRuntimeSessionOptions<Kind, Payload, Value>,
  ): CreatedOverlayRuntimeSession<Value>
  subscribe(listener: () => void): () => void
  getSnapshot(): readonly OverlayRuntimeSessionSnapshot[]
  getSessionSnapshot(sessionId: number): OverlayRuntimeSessionSnapshot | undefined
  isSessionActive(sessionId: number): boolean
  updateSessionPayload<Payload>(sessionId: number, update: (payload: Payload) => Payload): boolean
  markOpen(sessionId: number): boolean
  resolveSession<Value>(sessionId: number, value: Value): boolean
  close(reason?: OverlayCloseReason): boolean
  closeSession(sessionId: number, reason?: OverlayCloseReason): boolean
  requestClose(sessionId: number, reason: OverlayCloseRequestReason): boolean
  completeClose(sessionId: number): void
  closeAll(reason?: OverlayCloseReason): void
  dispose(reason?: OverlayCloseReason): void
}

type RuntimeEntry = OverlayRuntimeSessionSnapshot & {
  settled: boolean
  closeOnEscape: boolean
  closeOnOutsidePress: boolean
  closeValue(reason: OverlayCloseReason): unknown
  settle(value: unknown): void
}

const CLOSING_WARNING_DELAY_MS = 10_000
const EMPTY_SNAPSHOT: readonly OverlayRuntimeSessionSnapshot[] = []

export function isDevelopmentRuntime(): boolean {
  const runtimeProcess = (
    globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } }
  ).process

  if (runtimeProcess) return runtimeProcess.env?.NODE_ENV !== 'production'
  return Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV)
}

export function createOverlayRuntime(): OverlayRuntime {
  let nextId = 1
  let entries: RuntimeEntry[] = []
  let snapshot = EMPTY_SNAPSHOT
  const listeners = new Set<() => void>()
  const closingWarningTimers = new Map<number, ReturnType<typeof setTimeout>>()

  function notify() {
    for (const listener of listeners) listener()
  }

  function publish() {
    snapshot = entries.map(({ id, kind, open, payload, phase }) => ({
      id,
      kind,
      open,
      payload,
      phase,
    }))
    notify()
  }

  function findEntry(sessionId: number): RuntimeEntry | undefined {
    return entries.find((entry) => entry.id === sessionId)
  }

  function clearClosingWarning(sessionId: number) {
    const timer = closingWarningTimers.get(sessionId)
    if (timer === undefined) return

    clearTimeout(timer)
    closingWarningTimers.delete(sessionId)
  }

  function scheduleClosingWarning(entry: RuntimeEntry) {
    if (!isDevelopmentRuntime() || closingWarningTimers.has(entry.id)) return

    const timer = setTimeout(() => {
      closingWarningTimers.delete(entry.id)
      console.warn(
        `[Lyrd] ${entry.kind} overlay session ${entry.id} has remained in "closing" for 10 seconds. ` +
          'Call completeClose() after the exit transition finishes.',
      )
    }, CLOSING_WARNING_DELAY_MS)

    ;(timer as ReturnType<typeof setTimeout> & { unref?: () => void }).unref?.()
    closingWarningTimers.set(entry.id, timer)
  }

  function beginClose(entry: RuntimeEntry) {
    entry.open = false
    entry.phase = 'closing'
    scheduleClosingWarning(entry)
  }

  function settleEntry(entry: RuntimeEntry, value: unknown): boolean {
    if (entry.settled) return false

    entry.settled = true
    entry.settle(value)
    beginClose(entry)
    return true
  }

  function closeEntry(entry: RuntimeEntry, reason: OverlayCloseReason): boolean {
    if (entry.settled) return false
    return settleEntry(entry, entry.closeValue(reason))
  }

  function createSession<Kind extends string, Payload, Value>({
    kind,
    payload,
    closeValue,
    closeOnEscape = true,
    closeOnOutsidePress = true,
  }: CreateOverlayRuntimeSessionOptions<
    Kind,
    Payload,
    Value
  >): CreatedOverlayRuntimeSession<Value> {
    let settlePromise!: (value: Value) => void
    const promise = new Promise<Value>((resolve) => {
      settlePromise = resolve
    })
    const id = nextId++
    const entry: RuntimeEntry = {
      id,
      kind,
      open: false,
      phase: 'opening',
      payload,
      settled: false,
      closeOnEscape,
      closeOnOutsidePress,
      closeValue,
      settle: (value) => settlePromise(value as Value),
    }
    const handle = promise as OverlayHandle<Value>

    Object.defineProperty(handle, 'close', {
      configurable: false,
      enumerable: false,
      value: (reason: OverlayCloseReason = 'programmatic') => closeSession(id, reason),
      writable: false,
    })

    entries = [...entries, entry]
    publish()

    return { id, handle }
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  function getSnapshot(): readonly OverlayRuntimeSessionSnapshot[] {
    return snapshot
  }

  function getSessionSnapshot(sessionId: number): OverlayRuntimeSessionSnapshot | undefined {
    return snapshot.find(({ id }) => id === sessionId)
  }

  function isSessionActive(sessionId: number): boolean {
    const entry = findEntry(sessionId)
    return Boolean(entry && !entry.settled)
  }

  function updateSessionPayload<Payload>(
    sessionId: number,
    update: (payload: Payload) => Payload,
  ): boolean {
    const entry = findEntry(sessionId)
    if (!entry || entry.settled) return false

    entry.payload = update(entry.payload as Payload)
    publish()
    return true
  }

  function markOpen(sessionId: number): boolean {
    const entry = findEntry(sessionId)
    if (!entry || entry.settled || entry.phase !== 'opening') return false

    entry.open = true
    entry.phase = 'open'
    publish()
    return true
  }

  function resolveSession<Value>(sessionId: number, value: Value): boolean {
    const entry = findEntry(sessionId)
    if (!entry || !settleEntry(entry, value)) return false

    publish()
    return true
  }

  function close(reason: OverlayCloseReason = 'programmatic'): boolean {
    const top = entries.at(-1)
    if (!top || !closeEntry(top, reason)) return false

    publish()
    return true
  }

  function closeSession(sessionId: number, reason: OverlayCloseReason = 'programmatic'): boolean {
    const entry = findEntry(sessionId)
    if (!entry || !closeEntry(entry, reason)) return false

    publish()
    return true
  }

  function requestClose(sessionId: number, reason: OverlayCloseRequestReason): boolean {
    const top = entries.at(-1)
    if (!top || top.id !== sessionId || top.settled) return false
    if (reason === 'escape' && !top.closeOnEscape) return false
    if (reason === 'outside' && !top.closeOnOutsidePress) return false
    if (!closeEntry(top, reason)) return false

    publish()
    return true
  }

  function completeClose(sessionId: number): void {
    const entryIndex = entries.findIndex((entry) => entry.id === sessionId)
    const entry = entries[entryIndex]
    if (!entry || entry.phase !== 'closing') return

    clearClosingWarning(sessionId)
    entries = entries.filter(({ id }) => id !== sessionId)
    publish()
  }

  function closeAll(reason: OverlayCloseReason = 'programmatic'): void {
    let changed = false

    for (const entry of entries) {
      if (closeEntry(entry, reason)) changed = true
    }

    if (changed) publish()
  }

  function dispose(reason: OverlayCloseReason = 'programmatic'): void {
    for (const entry of entries) {
      if (!entry.settled) {
        entry.settled = true
        entry.settle(entry.closeValue(reason))
      }
      clearClosingWarning(entry.id)
    }

    entries = []
    snapshot = EMPTY_SNAPSHOT
    notify()
  }

  return {
    createSession,
    subscribe,
    getSnapshot,
    getSessionSnapshot,
    isSessionActive,
    updateSessionPayload,
    markOpen,
    resolveSession,
    close,
    closeSession,
    requestClose,
    completeClose,
    closeAll,
    dispose,
  }
}
