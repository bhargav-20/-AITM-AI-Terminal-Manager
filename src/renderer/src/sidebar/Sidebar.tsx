import { useState } from 'react'
import { useStore, type SessionMeta } from '../state/store'
import { spawnSession, spawnClaudeSession, focusSession, closeSession } from '../commands/sessions'
import { ClaudeSessions } from './ClaudeSessions'
import { sessionMenuItems } from '../commands/menus'
import { openContextMenu, type MenuItem } from '../ui/contextMenuBus'
import { toast } from '../ui/toastBus'
import { ACCENTS } from '../theme/themes'
import { ChevronIcon, PlusIcon, PinFilledIcon, SparkIcon, CloseIcon } from '../ui/icons'

const DRAG_TYPE = 'application/atm-session'

function basename(p: string): string {
  if (!p) return '~'
  const parts = p.replace(/\/+$/, '').split('/')
  return parts[parts.length - 1] || p
}

export function Sidebar(): React.JSX.Element {
  const sessions = useStore((s) => s.sessions)
  const order = useStore((s) => s.order)
  const groups = useStore((s) => s.groups)
  const groupOrder = useStore((s) => s.groupOrder)
  const activeId = useStore((s) => s.activeId)
  const toggleGroupCollapsed = useStore((s) => s.toggleGroupCollapsed)
  const setSessionGroup = useStore((s) => s.setSessionGroup)
  const renameGroup = useStore((s) => s.renameGroup)
  const setGroupColor = useStore((s) => s.setGroupColor)
  const removeGroup = useStore((s) => s.removeGroup)
  const createGroup = useStore((s) => s.createGroup)
  const updateSession = useStore((s) => s.updateSession)
  const editingSessionId = useStore((s) => s.editingSessionId)
  const setEditingSession = useStore((s) => s.setEditingSession)

  const [editingGroup, setEditingGroup] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)

  const byGroup: Record<string, SessionMeta[]> = {}
  for (const id of order) {
    const s = sessions[id]
    if (!s) continue
    ;(byGroup[s.groupId] ||= []).push(s)
  }

  const groupMenu = (gid: string): MenuItem[] => {
    const g = groups[gid]
    return [
      { label: 'Rename', onClick: () => setEditingGroup(gid) },
      {
        label: 'Change color',
        submenu: ACCENTS.map((a) => ({
          label: a.name,
          colorSwatch: a.value,
          checked: g.color === a.value,
          onClick: () => setGroupColor(gid, a.value),
        })),
      },
      { separator: true },
      { label: 'New terminal here', onClick: () => spawnSession({ kind: 'shell', groupId: gid }) },
      { label: 'New Claude here', onClick: () => spawnClaudeSession({ groupId: gid }) },
      { separator: true },
      {
        label: 'Delete group',
        danger: true,
        disabled: groupOrder.length <= 1,
        onClick: () => removeGroup(gid),
      },
    ]
  }

  const handleDrop = (gid: string) => (e: React.DragEvent): void => {
    e.preventDefault()
    const id = e.dataTransfer.getData(DRAG_TYPE) || dragging
    if (id) setSessionGroup(id, gid)
    setDragOver(null)
    setDragging(null)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__actions">
        <button className="sidebar__new" onClick={() => spawnClaudeSession()}>
          <SparkIcon />
          <span>New Claude</span>
        </button>
        <button
          className="sidebar__new sidebar__new--ghost"
          onClick={() => spawnSession({ kind: 'shell' })}
          title="New terminal (⌘T)"
        >
          <PlusIcon />
        </button>
      </div>

      <div className="sidebar__groups">
        <ClaudeSessions />
        {groupOrder.map((gid) => {
          const g = groups[gid]
          if (!g) return null
          const items = byGroup[gid] ?? []
          return (
            <div
              key={gid}
              className={`grp${dragOver === gid ? ' grp--dropover' : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                if (dragOver !== gid) setDragOver(gid)
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOver((prev) => (prev === gid ? null : prev))
                }
              }}
              onDrop={handleDrop(gid)}
            >
              <div
                className="grp__header"
                onClick={() => editingGroup !== gid && toggleGroupCollapsed(gid)}
                onContextMenu={(e) => openContextMenu(e, groupMenu(gid))}
              >
                <ChevronIcon className={`grp__chev${g.collapsed ? '' : ' grp__chev--open'}`} />
                <span className="grp__dot" style={{ background: g.color }} />
                {editingGroup === gid ? (
                  <input
                    className="grp__rename"
                    autoFocus
                    defaultValue={g.name}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={(e) => {
                      const v = e.target.value.trim()
                      if (v) renameGroup(gid, v)
                      setEditingGroup(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const v = (e.target as HTMLInputElement).value.trim()
                        if (v) renameGroup(gid, v)
                        setEditingGroup(null)
                      } else if (e.key === 'Escape') {
                        setEditingGroup(null)
                      }
                    }}
                  />
                ) : (
                  <span
                    className="grp__name"
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      setEditingGroup(gid)
                    }}
                  >
                    {g.name}
                  </span>
                )}
                <span className="grp__count">{items.length}</span>
              </div>

              {!g.collapsed && (
                <div className="grp__items">
                  {items.map((s) => {
                    const editing = editingSessionId === s.id
                    const commit = (value: string): void => {
                      const v = value.trim()
                      if (v) updateSession(s.id, { title: v })
                      setEditingSession(null)
                    }
                    return (
                      <div
                        key={s.id}
                        className={`row${activeId === s.id ? ' row--active' : ''}${
                          dragging === s.id ? ' row--dragging' : ''
                        }`}
                        draggable={!editing}
                        onDragStart={(e) => {
                          e.dataTransfer.setData(DRAG_TYPE, s.id)
                          e.dataTransfer.effectAllowed = 'move'
                          setDragging(s.id)
                        }}
                        onDragEnd={() => {
                          setDragging(null)
                          setDragOver(null)
                        }}
                        onClick={() => focusSession(s.id)}
                        onContextMenu={(e) => openContextMenu(e, sessionMenuItems(s.id))}
                        title={s.cwd || '~'}
                      >
                        <span
                          className={`row__status row__status--${s.status}`}
                          style={s.status !== 'exited' ? { background: g.color } : undefined}
                        />
                        {editing ? (
                          <input
                            className="row__rename"
                            autoFocus
                            defaultValue={s.title}
                            onFocus={(e) => e.target.select()}
                            onClick={(e) => e.stopPropagation()}
                            onBlur={(e) => commit(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commit((e.target as HTMLInputElement).value)
                              else if (e.key === 'Escape') setEditingSession(null)
                            }}
                          />
                        ) : (
                          <span
                            className="row__title"
                            onDoubleClick={(e) => {
                              e.stopPropagation()
                              setEditingSession(s.id)
                            }}
                          >
                            {s.title}
                          </span>
                        )}
                        {s.pinned && <PinFilledIcon size={10} className="row__pin" />}
                        {!editing && <span className="row__cwd">{basename(s.cwd)}</span>}
                        <button
                          className="row__close"
                          title="Close"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!closeSession(s.id)) toast('Tab is pinned — unpin to close')
                          }}
                        >
                          <CloseIcon size={12} />
                        </button>
                      </div>
                    )
                  })}
                  {items.length === 0 && <div className="grp__empty">Drop sessions here</div>}
                </div>
              )}
            </div>
          )
        })}

        <button
          className="sidebar__addgroup"
          onClick={() => {
            const id = createGroup()
            setEditingGroup(id)
          }}
        >
          <PlusIcon size={12} />
          <span>New group</span>
        </button>
      </div>
    </aside>
  )
}
