import {
  Tray,
  Menu,
  Notification,
  nativeImage,
  type BrowserWindow,
  type MenuItemConstructorOptions,
} from 'electron'
import type { ClaudeSession, ClaudeStatus } from '../shared/claude'

interface TrayHooks {
  getWindow: () => BrowserWindow | null
  sendMenu: (action: string) => void
  focusSession: (sessionId: string) => void
}

const GLYPH: Record<ClaudeStatus, string> = {
  working: '◐',
  'awaiting-input': '◉',
  idle: '○',
  ended: '·',
  unknown: '·',
}

let tray: Tray | null = null
let hooks: TrayHooks | null = null
let notificationsEnabled = true
let prevStatus = new Map<string, ClaudeStatus>()

function basename(p: string): string {
  if (!p) return '~'
  const parts = p.replace(/\/+$/, '').split('/')
  return parts[parts.length - 1] || p
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s
}

function showWindow(): void {
  const w = hooks?.getWindow()
  if (!w) return
  if (w.isMinimized()) w.restore()
  w.show()
  w.focus()
}

export function initTray(h: TrayHooks): void {
  if (process.platform !== 'darwin') return // macOS menu-bar feature for now
  hooks = h
  tray = new Tray(nativeImage.createEmpty())
  tray.setTitle(' ❯_')
  tray.setToolTip('AI Terminal Manager')
  update([])
}

export function setNotificationsEnabled(v: boolean): void {
  notificationsEnabled = v
}

export function update(sessions: ClaudeSession[]): void {
  if (!tray || !hooks) return

  const needs = sessions.filter((s) => s.status === 'awaiting-input').length
  const working = sessions.filter((s) => s.status === 'working').length
  tray.setTitle(needs > 0 ? ` ❯_ ${needs}!` : working > 0 ? ` ❯_ ${working}…` : ' ❯_')

  const items: MenuItemConstructorOptions[] = [
    {
      label: 'New Claude Session',
      click: () => {
        showWindow()
        hooks?.sendMenu('menu:newClaude')
      },
    },
    {
      label: 'New Terminal',
      click: () => {
        showWindow()
        hooks?.sendMenu('menu:newTerminal')
      },
    },
    { type: 'separator' },
  ]
  if (sessions.length === 0) {
    items.push({ label: 'No Claude sessions', enabled: false })
  } else {
    for (const s of sessions.slice(0, 12)) {
      const name = truncate(s.title || basename(s.cwd) || s.sessionId.slice(0, 8), 38)
      items.push({ label: `${GLYPH[s.status]}  ${name}`, click: () => hooks?.focusSession(s.sessionId) })
    }
  }
  items.push(
    { type: 'separator' },
    { label: 'Show AI Terminal Manager', click: showWindow },
    { label: 'Quit', role: 'quit' },
  )
  tray.setContextMenu(Menu.buildFromTemplate(items))

  // Notify when a session finishes a turn and now needs the user.
  if (notificationsEnabled && Notification.isSupported()) {
    for (const s of sessions) {
      if (prevStatus.get(s.sessionId) === 'working' && s.status === 'awaiting-input') {
        const n = new Notification({
          title: 'Claude is waiting for you',
          body: s.title || basename(s.cwd) || 'Session',
        })
        n.on('click', () => hooks?.focusSession(s.sessionId))
        n.show()
      }
    }
  }
  prevStatus = new Map(sessions.map((s) => [s.sessionId, s.status]))
}
