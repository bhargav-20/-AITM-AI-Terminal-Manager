import type { IDockviewPanelHeaderProps } from 'dockview'
import { useStore } from '../state/store'
import { useClaudeStore } from '../state/claudeStore'
import { useCorrelationStore } from '../state/correlationStore'
import { closeSession } from '../commands/sessions'
import { sessionMenuItems } from '../commands/menus'
import { openContextMenu } from '../ui/contextMenuBus'
import { CLAUDE_STATUS_COLOR, CLAUDE_STATUS_LABEL } from '../util/claudeStatus'
import { PinIcon, PinFilledIcon, CloseIcon } from '../ui/icons'

type TabParams = { terminalId: string }

export function CustomTab(props: IDockviewPanelHeaderProps<TabParams>): React.JSX.Element {
  const id = props.params.terminalId
  const session = useStore((s) => s.sessions[id])
  const group = useStore((s) => (session ? s.groups[session.groupId] : undefined))
  const togglePin = useStore((s) => s.togglePin)
  const corrId = useCorrelationStore((s) => s.terminalToSession[id])
  const claudeSession = useClaudeStore((s) =>
    corrId ? s.sessions.find((x) => x.sessionId === corrId) : undefined,
  )

  if (!session) {
    return <div className="atm-tab">{props.api.title}</div>
  }

  const color = group?.color ?? '#8a90a0'
  const cs = claudeSession?.status
  // Correlated claude terminals show their live session status; others fall back
  // to the group color (dimmed when the pty has exited).
  const dotColor = cs
    ? CLAUDE_STATUS_COLOR[cs]
    : session.status === 'exited'
      ? undefined
      : color
  const pulse = cs === 'working' || (!cs && session.status === 'starting')
  const titleAttr = cs
    ? `${session.title} · ${CLAUDE_STATUS_LABEL[cs]} — ${session.cwd || '~'}`
    : `${session.title} — ${session.cwd || '~'}`

  return (
    <div
      className={`atm-tab${session.pinned ? ' atm-tab--pinned' : ''}`}
      style={{ ['--group-color' as string]: color }}
      title={titleAttr}
      onContextMenu={(e) => openContextMenu(e, sessionMenuItems(id))}
    >
      <span
        className={`atm-tab__status${pulse ? ' is-pulse' : ''}${
          dotColor ? '' : ' atm-tab__status--exited'
        }`}
        style={dotColor ? { background: dotColor } : undefined}
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
