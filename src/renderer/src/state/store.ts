import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SessionStatus = 'starting' | 'running' | 'exited'
export type SessionKind = 'shell' | 'claude'

export interface SessionGroup {
  id: string
  name: string
  color: string
  collapsed: boolean
}

export interface SessionMeta {
  id: string // == dockview panel id == terminalId
  title: string
  cwd: string
  /** Command to run; undefined = user's login shell. */
  shell?: string
  args?: string[]
  /** Command typed into the shell right after spawn (e.g. claude launch). */
  autorun?: string
  kind: SessionKind
  groupId: string
  pinned: boolean
  status: SessionStatus
  exitCode?: number
  createdAt: number
}

export const DEFAULT_GROUPS: SessionGroup[] = [
  { id: 'claude', name: 'Claude Code', color: '#6ea8fe', collapsed: false },
  { id: 'general', name: 'Terminals', color: '#8a90a0', collapsed: false },
  { id: 'release', name: 'Release', color: '#e2b66d', collapsed: false },
  { id: 'testing', name: 'Testing', color: '#5fd38a', collapsed: false },
]

// Fallback group that always exists; deleting a group reassigns its sessions here.
export const FALLBACK_GROUP_ID = 'general'

export const GROUP_PALETTE = [
  '#6ea8fe',
  '#b48ef0',
  '#5fd38a',
  '#e2b66d',
  '#f08a9b',
  '#5fc9d6',
  '#ff6b6b',
  '#8a90a0',
]

export const DEFAULT_THEME_ID = 'midnight'
export const DEFAULT_ACCENT = '#6ea8fe'
export const DEFAULT_FONT_SIZE = 13

interface AppState {
  sessions: Record<string, SessionMeta>
  order: string[]
  groups: Record<string, SessionGroup>
  groupOrder: string[]
  activeId: string | null

  // appearance (persisted)
  themeId: string
  accent: string
  terminalFontSize: number

  // transient UI (not persisted)
  settingsOpen: boolean
  shortcutsOpen: boolean

  addSession: (s: SessionMeta) => void
  removeSession: (id: string) => void
  updateSession: (id: string, patch: Partial<SessionMeta>) => void
  setActive: (id: string | null) => void
  togglePin: (id: string) => void
  setSessionGroup: (id: string, groupId: string) => void

  createGroup: (name?: string, color?: string) => string
  removeGroup: (id: string) => void
  renameGroup: (id: string, name: string) => void
  setGroupColor: (id: string, color: string) => void
  toggleGroupCollapsed: (id: string) => void

  setThemeId: (id: string) => void
  setAccent: (color: string) => void
  setTerminalFontSize: (n: number) => void
  setSettingsOpen: (open: boolean) => void
  setShortcutsOpen: (open: boolean) => void
}

function groupsRecord(): Record<string, SessionGroup> {
  return Object.fromEntries(DEFAULT_GROUPS.map((g) => [g.id, { ...g }]))
}

let groupCounter = 0

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      sessions: {},
      order: [],
      groups: groupsRecord(),
      groupOrder: DEFAULT_GROUPS.map((g) => g.id),
      activeId: null,

      themeId: DEFAULT_THEME_ID,
      accent: DEFAULT_ACCENT,
      terminalFontSize: DEFAULT_FONT_SIZE,

      settingsOpen: false,
      shortcutsOpen: false,

      addSession: (s) =>
        set((st) => ({
          sessions: { ...st.sessions, [s.id]: s },
          order: st.order.includes(s.id) ? st.order : [...st.order, s.id],
          activeId: s.id,
        })),

      removeSession: (id) =>
        set((st) => {
          const sessions = { ...st.sessions }
          delete sessions[id]
          const order = st.order.filter((x) => x !== id)
          return {
            sessions,
            order,
            activeId: st.activeId === id ? (order[order.length - 1] ?? null) : st.activeId,
          }
        }),

      updateSession: (id, patch) =>
        set((st) =>
          st.sessions[id]
            ? { sessions: { ...st.sessions, [id]: { ...st.sessions[id], ...patch } } }
            : {},
        ),

      setActive: (id) => set({ activeId: id }),

      togglePin: (id) =>
        set((st) =>
          st.sessions[id]
            ? {
                sessions: {
                  ...st.sessions,
                  [id]: { ...st.sessions[id], pinned: !st.sessions[id].pinned },
                },
              }
            : {},
        ),

      setSessionGroup: (id, groupId) =>
        set((st) =>
          st.sessions[id]
            ? { sessions: { ...st.sessions, [id]: { ...st.sessions[id], groupId } } }
            : {},
        ),

      createGroup: (name, color) => {
        groupCounter += 1
        const id = `g${Date.now().toString(36)}${groupCounter}`
        const st = get()
        const c = color ?? GROUP_PALETTE[st.groupOrder.length % GROUP_PALETTE.length]
        set({
          groups: { ...st.groups, [id]: { id, name: name ?? 'New Group', color: c, collapsed: false } },
          groupOrder: [...st.groupOrder, id],
        })
        return id
      },

      removeGroup: (id) =>
        set((st) => {
          if (!st.groups[id]) return {}
          const remaining = st.groupOrder.filter((g) => g !== id)
          if (remaining.length === 0) return {} // never delete the last group
          const fallback = st.groups[FALLBACK_GROUP_ID] ? FALLBACK_GROUP_ID : remaining[0]
          const sessions = { ...st.sessions }
          for (const sid of Object.keys(sessions)) {
            if (sessions[sid].groupId === id) sessions[sid] = { ...sessions[sid], groupId: fallback }
          }
          const groups = { ...st.groups }
          delete groups[id]
          return { groups, groupOrder: remaining, sessions }
        }),

      renameGroup: (id, name) =>
        set((st) =>
          st.groups[id] ? { groups: { ...st.groups, [id]: { ...st.groups[id], name } } } : {},
        ),

      setGroupColor: (id, color) =>
        set((st) =>
          st.groups[id] ? { groups: { ...st.groups, [id]: { ...st.groups[id], color } } } : {},
        ),

      toggleGroupCollapsed: (id) =>
        set((st) =>
          st.groups[id]
            ? {
                groups: {
                  ...st.groups,
                  [id]: { ...st.groups[id], collapsed: !st.groups[id].collapsed },
                },
              }
            : {},
        ),

      setThemeId: (id) => set({ themeId: id }),
      setAccent: (color) => set({ accent: color }),
      setTerminalFontSize: (n) => set({ terminalFontSize: Math.max(9, Math.min(22, n)) }),
      setSettingsOpen: (open) => set({ settingsOpen: open }),
      setShortcutsOpen: (open) => set({ shortcutsOpen: open }),
    }),
    {
      name: 'atm-workspace',
      partialize: (st) => ({
        sessions: st.sessions,
        order: st.order,
        groups: st.groups,
        groupOrder: st.groupOrder,
        themeId: st.themeId,
        accent: st.accent,
        terminalFontSize: st.terminalFontSize,
      }),
    },
  ),
)
