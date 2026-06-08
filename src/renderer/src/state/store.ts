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
  { id: 'release', name: 'Release', color: '#e2c08d', collapsed: false },
  { id: 'testing', name: 'Testing', color: '#6bd968', collapsed: false },
]

interface AppState {
  sessions: Record<string, SessionMeta>
  order: string[]
  groups: Record<string, SessionGroup>
  groupOrder: string[]
  activeId: string | null

  addSession: (s: SessionMeta) => void
  removeSession: (id: string) => void
  updateSession: (id: string, patch: Partial<SessionMeta>) => void
  setActive: (id: string | null) => void
  togglePin: (id: string) => void
  setSessionGroup: (id: string, groupId: string) => void

  addGroup: (g: SessionGroup) => void
  toggleGroupCollapsed: (id: string) => void
  renameGroup: (id: string, name: string) => void
}

function groupsRecord(): Record<string, SessionGroup> {
  return Object.fromEntries(DEFAULT_GROUPS.map((g) => [g.id, { ...g }]))
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      sessions: {},
      order: [],
      groups: groupsRecord(),
      groupOrder: DEFAULT_GROUPS.map((g) => g.id),
      activeId: null,

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

      addGroup: (g) =>
        set((st) => ({
          groups: { ...st.groups, [g.id]: g },
          groupOrder: st.groupOrder.includes(g.id) ? st.groupOrder : [...st.groupOrder, g.id],
        })),

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

      renameGroup: (id, name) =>
        set((st) =>
          st.groups[id] ? { groups: { ...st.groups, [id]: { ...st.groups[id], name } } } : {},
        ),
    }),
    {
      name: 'atm-workspace',
      // Persist only metadata; dockview layout is persisted separately.
      partialize: (st) => ({
        sessions: st.sessions,
        order: st.order,
        groups: st.groups,
        groupOrder: st.groupOrder,
      }),
    },
  ),
)
