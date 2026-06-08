import { create } from 'zustand'
import type { ClaudeSession } from '@shared/claude'
import type { SessionMeta } from './store'

interface CorrelationState {
  /** app terminalId -> observed sessionId */
  terminalToSession: Record<string, string>
  /** observed sessionId -> app terminalId */
  sessionToTerminal: Record<string, string>
  recompute: (terminals: Record<string, SessionMeta>, sessions: ClaudeSession[]) => void
}

/**
 * Heuristic correlation: match each app-spawned `claude` terminal to the observed
 * session in the same cwd with the most recent activity (cwd is absolute on both
 * sides). Claude isn't multi-launched per cwd in practice, so cwd + recency is
 * sufficient and degrades gracefully.
 */
function correlate(
  terminals: Record<string, SessionMeta>,
  sessions: ClaudeSession[],
): Pick<CorrelationState, 'terminalToSession' | 'sessionToTerminal'> {
  const terminalToSession: Record<string, string> = {}
  const sessionToTerminal: Record<string, string> = {}

  const claudeTerms = Object.values(terminals)
    .filter((t) => t.kind === 'claude' && t.cwd)
    .sort((a, b) => b.createdAt - a.createdAt) // newest terminal first

  const claimed = new Set<string>()
  for (const term of claudeTerms) {
    const candidate = sessions
      .filter((s) => s.cwd === term.cwd && s.status !== 'ended' && !claimed.has(s.sessionId))
      .sort((a, b) => b.lastActivityTs - a.lastActivityTs)[0]
    if (candidate) {
      claimed.add(candidate.sessionId)
      terminalToSession[term.id] = candidate.sessionId
      sessionToTerminal[candidate.sessionId] = term.id
    }
  }
  return { terminalToSession, sessionToTerminal }
}

export const useCorrelationStore = create<CorrelationState>((set) => ({
  terminalToSession: {},
  sessionToTerminal: {},
  recompute: (terminals, sessions) => set(correlate(terminals, sessions)),
}))
