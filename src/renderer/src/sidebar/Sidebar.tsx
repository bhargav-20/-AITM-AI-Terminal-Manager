import { useStore, type SessionMeta } from '../state/store'
import { spawnSession, focusSession } from '../commands/sessions'
import { ChevronIcon, PlusIcon, PinFilledIcon, SparkIcon } from '../ui/icons'

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

  const byGroup: Record<string, SessionMeta[]> = {}
  for (const id of order) {
    const s = sessions[id]
    if (!s) continue
    ;(byGroup[s.groupId] ||= []).push(s)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__actions">
        <button className="sidebar__new" onClick={() => spawnSession({ kind: 'claude' })}>
          <SparkIcon />
          <span>New Claude</span>
        </button>
        <button
          className="sidebar__new sidebar__new--ghost"
          onClick={() => spawnSession({ kind: 'shell' })}
          title="New terminal"
        >
          <PlusIcon />
        </button>
      </div>

      <div className="sidebar__groups">
        {groupOrder.map((gid) => {
          const g = groups[gid]
          if (!g) return null
          const items = byGroup[gid] ?? []
          if (items.length === 0) return null
          return (
            <div className="grp" key={gid}>
              <button className="grp__header" onClick={() => toggleGroupCollapsed(gid)}>
                <ChevronIcon className={`grp__chev${g.collapsed ? '' : ' grp__chev--open'}`} />
                <span className="grp__dot" style={{ background: g.color }} />
                <span className="grp__name">{g.name}</span>
                <span className="grp__count">{items.length}</span>
              </button>
              {!g.collapsed && (
                <div className="grp__items">
                  {items.map((s) => (
                    <button
                      key={s.id}
                      className={`row${activeId === s.id ? ' row--active' : ''}`}
                      onClick={() => focusSession(s.id)}
                      title={s.cwd || '~'}
                    >
                      <span
                        className={`row__status row__status--${s.status}`}
                        style={s.status !== 'exited' ? { background: g.color } : undefined}
                      />
                      <span className="row__title">{s.title}</span>
                      {s.pinned && <PinFilledIcon size={10} className="row__pin" />}
                      <span className="row__cwd">{basename(s.cwd)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {order.length === 0 && <div className="sidebar__empty">No sessions yet</div>}
      </div>
    </aside>
  )
}
