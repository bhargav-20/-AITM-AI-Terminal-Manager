import { useClaudeStore } from '../state/claudeStore'
import { useStore } from '../state/store'
import { metricLabel } from './sessionMetric'
import { openDiff } from '../commands/diff'
import { DiffIcon } from '../ui/icons'
import type { ClaudeStatus } from '@shared/claude'

const STATUS_COLOR: Record<ClaudeStatus, string> = {
  working: '#6ea8fe',
  'awaiting-input': '#e2b66d',
  idle: '#8a90a0',
  ended: '#4a4f5c',
  unknown: '#5a6172',
}

function basename(p: string): string {
  if (!p) return '~'
  const parts = p.replace(/\/+$/, '').split('/')
  return parts[parts.length - 1] || p
}

export function ClaudeSessions(): React.JSX.Element | null {
  const sessions = useClaudeStore((s) => s.sessions)
  const metric = useStore((s) => s.sessionMetric)
  const rates = useStore((s) => s.rates)
  if (sessions.length === 0) return null

  return (
    <div className="claude-list">
      <div className="claude-list__header">
        <span>Claude Sessions</span>
        <span className="claude-list__count">{sessions.length}</span>
      </div>
      {sessions.map((s) => (
        <div className="csess" key={s.sessionId} title={`${s.status} — ${s.statusReason}`}>
          <span
            className={`csess__status csess__status--${s.status}`}
            style={{ background: STATUS_COLOR[s.status] }}
          />
          <div className="csess__main">
            <div className="csess__title">
              {s.title || basename(s.cwd) || s.sessionId.slice(0, 8)}
            </div>
            <div className="csess__meta">
              <span className="csess__cwd">{basename(s.cwd)}</span>
              {s.gitBranch && s.gitBranch !== 'HEAD' && (
                <span className="csess__branch">⎇ {s.gitBranch}</span>
              )}
            </div>
          </div>
          <div className="csess__stats">
            {metricLabel(s, metric, rates) && (
              <span className="csess__cost">{metricLabel(s, metric, rates)}</span>
            )}
            {s.tasks.total > 0 && (
              <span className="csess__tasks">
                {s.tasks.completed}/{s.tasks.total}
              </span>
            )}
          </div>
          <button
            className="csess__diff"
            title="Show git diff"
            onClick={(e) => {
              e.stopPropagation()
              openDiff(s.cwd, s.title || undefined)
            }}
          >
            <DiffIcon size={13} />
          </button>
        </div>
      ))}
    </div>
  )
}
