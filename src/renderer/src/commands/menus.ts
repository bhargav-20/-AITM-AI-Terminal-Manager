import { useStore } from '../state/store'
import { closeSession } from './sessions'
import { openDiff } from './diff'
import type { MenuItem } from '../ui/contextMenuBus'

/** Context-menu items for a session (shared by dockview tabs and sidebar rows). */
export function sessionMenuItems(id: string): MenuItem[] {
  const st = useStore.getState()
  const s = st.sessions[id]
  if (!s) return []
  const groups = st.groupOrder.map((gid) => st.groups[gid]).filter(Boolean)

  return [
    {
      label: 'Rename',
      onClick: () => useStore.getState().setEditingSession(id),
    },
    {
      label: s.pinned ? 'Unpin' : 'Pin',
      onClick: () => useStore.getState().togglePin(id),
    },
    {
      label: 'Open diff',
      onClick: () => openDiff(s.cwd, s.title),
    },
    {
      label: 'Close',
      danger: true,
      onClick: () => closeSession(id, true),
    },
    { separator: true },
    {
      label: 'Move to group',
      submenu: groups.map((g) => ({
        label: g.name,
        colorSwatch: g.color,
        checked: g.id === s.groupId,
        onClick: () => useStore.getState().setSessionGroup(id, g.id),
      })),
    },
  ]
}
