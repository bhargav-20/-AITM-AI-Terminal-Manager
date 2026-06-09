import { useState } from 'react'
import { useClaudeStore } from '../state/claudeStore'
import { useStore } from '../state/store'
import { useCorrelationStore } from '../state/correlationStore'
import { metricLabel } from './sessionMetric'
import { openDiff } from '../commands/diff'
import { focusSession, resumeClaudeSession } from '../commands/sessions'
import { DiffIcon, PlayIcon } from '../ui/icons'
import { CLAUDE_STATUS_COLOR } from '../util/claudeStatus'

function basename(p: string): string {
  if (!p) return '~'
  const parts = p.replace(/\/+$/, '').split('/')
  return parts[parts.length - 1] || p
}

export function ClaudeSessions(): React.JSX.Element | null {
  const sessions = useClaudeStore((s) => s.sessions)
  const metric = useStore((s) => s.sessionMetric)
  const rates = useStore((s) => s.rates)
  const sessionToTerminal = useCorrelationStore((s) => s.sessionToTerminal)
  const [expanded, setExpanded] = useState(false)
  if (sessions.length === 0) return null

  const LIMIT = 6
  const visible = expanded ? sessions : sessions.slice(0, LIMIT)
  const overflow = sessions.length - LIMIT

  return (
    <div className="claude-list">
      <div className="claude-list__header">
        <span>Claude Sessions</span>
        <span className="claude-list__count">{sessions.length}</span>
      </div>
      {visible.map((s) => {
        const ownedTerminal = sessionToTerminal[s.sessionId]
        return (
          <div
            className="csess csess--clickable"
            key={s.sessionId}
            title={`${s.status} — ${s.statusReason} · ${
              ownedTerminal ? 'click to focus its tab' : 'click to resume in a new tab'
            }`}
            onClick={() =>
              ownedTerminal
                ? focusSession(ownedTerminal)
                : resumeClaudeSession(s.sessionId, s.cwd, s.title)
            }
          >
            <span
              className={`csess__status csess__status--${s.status}`}
              style={{ background: CLAUDE_STATUS_COLOR[s.status] }}
            />
            <div className="csess__main">
              <div className="csess__title">
                {s.title || basename(s.cwd) || s.sessionId.slice(0, 8)}
                {ownedTerminal && <span className="csess__owned" title="Running in a tab here">↗</span>}
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
            {!ownedTerminal && (
              <button
                className="csess__diff"
                title="Resume in a new tab"
                onClick={(e) => {
                  e.stopPropagation()
                  resumeClaudeSession(s.sessionId, s.cwd, s.title)
                }}
              >
                <PlayIcon size={11} />
              </button>
            )}
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
        )
      })}
      {overflow > 0 && (
        <button className="claude-list__more" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Show less' : `View ${overflow} more`}
        </button>
      )}
    </div>
  )
}
