import { useEffect } from 'react'
import { Sidebar } from './sidebar/Sidebar'
import { LayoutRoot } from './layout/LayoutRoot'
import { Toast } from './ui/Toast'
import { ContextMenu } from './ui/ContextMenu'
import { SettingsModal } from './ui/SettingsModal'
import { ShortcutsModal } from './ui/ShortcutsModal'
import { toast } from './ui/toastBus'
import { GearIcon } from './ui/icons'
import { Logo } from './ui/Logo'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { applyTheme } from './theme/applyTheme'
import { useStore } from './state/store'
import { useClaudeStore } from './state/claudeStore'
import { useCorrelationStore } from './state/correlationStore'
import { spawnSession, spawnClaudeSession, closeActiveSession, focusSession } from './commands/sessions'

export function App(): React.JSX.Element {
  useKeyboardShortcuts()

  const themeId = useStore((s) => s.themeId)
  const accent = useStore((s) => s.accent)
  const fontSize = useStore((s) => s.terminalFontSize)
  const setSettingsOpen = useStore((s) => s.setSettingsOpen)
  const setShortcutsOpen = useStore((s) => s.setShortcutsOpen)
  const terminals = useStore((s) => s.sessions)
  const claudeSessions = useClaudeStore((s) => s.sessions)
  const notificationsEnabled = useStore((s) => s.notificationsEnabled)

  // Recompute terminal <-> session correlation whenever either set changes.
  useEffect(() => {
    useCorrelationStore.getState().recompute(terminals, claudeSessions)
  }, [terminals, claudeSessions])

  // Keep the main process in sync with the notifications preference.
  useEffect(() => {
    void window.atm.setNotificationsEnabled(notificationsEnabled)
  }, [notificationsEnabled])

  // Notification / tray click -> focus the session's tab if it's app-owned.
  useEffect(() => {
    return window.atm.onFocusSession((sessionId) => {
      const terminalId = useCorrelationStore.getState().sessionToTerminal[sessionId]
      if (terminalId) focusSession(terminalId)
    })
  }, [])

  // Re-apply appearance whenever it changes (initial apply happens in main.tsx).
  useEffect(() => {
    applyTheme(themeId, accent, fontSize)
  }, [themeId, accent, fontSize])

  // Live Claude session awareness: hydrate, then subscribe to pushed snapshots.
  useEffect(() => {
    const setSessions = useClaudeStore.getState().setSessions
    window.atm.claude.getSnapshot().then(setSessions).catch(() => undefined)
    return window.atm.claude.onSnapshot(setSessions)
  }, [])

  useEffect(() => {
    window.atm.onMenuAction((action) => {
      switch (action) {
        case 'menu:newTerminal':
          spawnSession({ kind: 'shell' })
          break
        case 'menu:newClaude':
          spawnClaudeSession()
          break
        case 'menu:closeActive':
          if (!closeActiveSession(false)) toast('Tab is pinned — ⇧⌘W to force close')
          break
        case 'menu:forceCloseActive':
          closeActiveSession(true)
          break
      }
    })
  }, [])

  return (
    <div className="app-shell">
      <header className="titlebar">
        <div className="titlebar__brand">
          <Logo size={18} />
          <span className="titlebar__title">AI Terminal Manager</span>
        </div>
        <div className="titlebar__actions">
          <button
            className="iconbtn"
            title="Keyboard shortcuts (⌘/)"
            onClick={() => setShortcutsOpen(true)}
          >
            ?
          </button>
          <button className="iconbtn" title="Settings (⌘,)" onClick={() => setSettingsOpen(true)}>
            <GearIcon />
          </button>
        </div>
      </header>
      <div className="app-body">
        <Sidebar />
        <main className="workspace-root">
          <LayoutRoot />
        </main>
      </div>
      <Toast />
      <ContextMenu />
      <SettingsModal />
      <ShortcutsModal />
    </div>
  )
}
