import { getDockApi } from '../layout/dockApi'
import { useStore, type SessionKind } from '../state/store'
import { TerminalManager } from '../terminal/TerminalManager'
import { toast } from '../ui/toastBus'

let counter = 0
function newId(): string {
  counter += 1
  return `s${Date.now().toString(36)}${counter}`
}

export interface SpawnSessionOptions {
  kind: SessionKind
  cwd?: string
  groupId?: string
  title?: string
  shell?: string
  args?: string[]
  autorun?: string
}

const defaultGroupFor = (kind: SessionKind): string => (kind === 'claude' ? 'claude' : 'general')
const defaultTitleFor = (kind: SessionKind): string => (kind === 'claude' ? 'Claude' : 'zsh')

/** Create a session: register metadata, add a dockview panel, spawn its pty on mount. */
export function spawnSession(opts: SpawnSessionOptions): string {
  const id = newId()
  useStore.getState().addSession({
    id,
    title: opts.title ?? defaultTitleFor(opts.kind),
    // Resolve to an absolute cwd so it matches the transcript's cwd for correlation.
    cwd: opts.cwd?.trim() || window.atm.homeDir,
    shell: opts.shell,
    args: opts.args,
    autorun:
      opts.autorun ??
      (opts.kind === 'claude' ? `${useStore.getState().claudeCommand}\r` : undefined),
    kind: opts.kind,
    groupId: opts.groupId ?? defaultGroupFor(opts.kind),
    pinned: false,
    status: 'starting',
    createdAt: Date.now(),
  })

  getDockApi()?.addPanel({
    id,
    component: 'terminal',
    tabComponent: 'custom',
    title: opts.title ?? defaultTitleFor(opts.kind),
    params: { terminalId: id },
  })
  return id
}

/**
 * Spawn a Claude session and, in the background, warn if the configured command
 * isn't resolvable on PATH (so the user isn't left wondering why nothing launched).
 */
export function spawnClaudeSession(opts: Omit<SpawnSessionOptions, 'kind'> = {}): string {
  const id = spawnSession({ ...opts, kind: 'claude' })
  const first = useStore.getState().claudeCommand.trim().split(/\s+/)[0]
  if (first) {
    window.atm
      .resolveCommand(first)
      .then((found) => {
        if (!found) {
          toast(`"${first}" not found on PATH — set the Claude command in Settings (⌘,)`)
        }
      })
      .catch(() => undefined)
  }
  return id
}

/** Close a session. Pinned sessions require `force`. Returns false if blocked. */
export function closeSession(id: string, force = false): boolean {
  const s = useStore.getState().sessions[id]
  if (!s) return true
  if (s.pinned && !force) return false
  const api = getDockApi()
  const panel = api?.getPanel(id)
  if (panel) {
    api?.removePanel(panel) // triggers onWillRemove cleanup -> store + terminal disposal
  } else {
    cleanupSession(id)
  }
  return true
}

/** Bring a session's panel to the foreground and focus its terminal. */
export function focusSession(id: string): void {
  const panel = getDockApi()?.getPanel(id)
  if (panel) {
    panel.api.setActive()
    TerminalManager.focus(id)
  }
}

/** Tear down store + terminal for a session (called when its panel is removed). */
export function cleanupSession(id: string): void {
  TerminalManager.dispose(id)
  useStore.getState().removeSession(id)
}

export function closeActiveSession(force = false): boolean {
  const activeId = useStore.getState().activeId
  if (!activeId) return false
  return closeSession(activeId, force)
}

export function togglePinActive(): void {
  const activeId = useStore.getState().activeId
  if (activeId) useStore.getState().togglePin(activeId)
}

/** Focus the Nth panel (0-based) in dockview tab order. */
export function focusTabByIndex(index: number): void {
  const panels = getDockApi()?.panels ?? []
  const panel = panels[index]
  if (panel) focusSession(panel.id)
}

export function focusAdjacentTab(delta: number): void {
  const api = getDockApi()
  const panels = api?.panels ?? []
  if (panels.length === 0) return
  const activeId = useStore.getState().activeId
  const current = panels.findIndex((p) => p.id === activeId)
  const base = current < 0 ? 0 : current
  const next = (base + delta + panels.length) % panels.length
  focusSession(panels[next].id)
}
