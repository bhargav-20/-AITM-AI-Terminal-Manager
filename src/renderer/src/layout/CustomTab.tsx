import type { IDockviewPanelHeaderProps } from 'dockview'
import { useStore } from '../state/store'
import { closeSession } from '../commands/sessions'
import { PinIcon, PinFilledIcon, CloseIcon } from '../ui/icons'

type TabParams = { terminalId: string }

export function CustomTab(props: IDockviewPanelHeaderProps<TabParams>): React.JSX.Element {
  const id = props.params.terminalId
  const session = useStore((s) => s.sessions[id])
  const group = useStore((s) => (session ? s.groups[session.groupId] : undefined))
  const togglePin = useStore((s) => s.togglePin)

  if (!session) {
    return <div className="atm-tab">{props.api.title}</div>
  }

  const color = group?.color ?? '#8a90a0'

  return (
    <div
      className={`atm-tab${session.pinned ? ' atm-tab--pinned' : ''}`}
      style={{ ['--group-color' as string]: color }}
      title={`${session.title} — ${session.cwd || '~'}`}
    >
      <span
        className={`atm-tab__status atm-tab__status--${session.status}`}
        style={session.status !== 'exited' ? { background: color } : undefined}
      />
      <span className="atm-tab__title">{session.title}</span>

      <button
        className="atm-tab__btn atm-tab__pin"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          togglePin(id)
        }}
        title={session.pinned ? 'Unpin (allows Cmd+W close)' : 'Pin (prevents accidental close)'}
      >
        {session.pinned ? <PinFilledIcon /> : <PinIcon />}
      </button>

      {!session.pinned && (
        <button
          className="atm-tab__btn atm-tab__close"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            closeSession(id)
          }}
          title="Close"
        >
          <CloseIcon />
        </button>
      )}
    </div>
  )
}
