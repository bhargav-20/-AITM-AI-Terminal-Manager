import type { ClaudeStatus } from '../../../shared/claude'

export interface StatusSignals {
  /** A pid is known for this session (from registry or app correlation). */
  pidKnown: boolean
  /** kill(pid,0) result; undefined when pid unknown. */
  pidAlive?: boolean
  lastType?: string
  lastStopReason?: string
  /** last transcript line was a user/queued prompt with no assistant reply yet. */
  awaitingReply: boolean
  lastActivityTs: number
}

export const IDLE_MS = 5 * 60 * 1000

export interface StatusResult {
  status: ClaudeStatus
  reason: string
}

/**
 * Pure status derivation. Priority: dead pid -> ended; stale -> idle; mid-turn or
 * unanswered prompt -> working; completed turn -> awaiting-input; else unknown.
 */
export function computeStatus(s: StatusSignals, now: number): StatusResult {
  if (s.pidKnown && s.pidAlive === false) {
    return { status: 'ended', reason: 'process exited' }
  }

  const sinceMs = now - s.lastActivityTs
  if (sinceMs > IDLE_MS) {
    return { status: 'idle', reason: `no activity for ${Math.round(sinceMs / 60000)}m` }
  }

  if (s.lastStopReason === 'tool_use') {
    return { status: 'working', reason: 'running a tool' }
  }
  if (s.awaitingReply || s.lastType === 'user' || s.lastType === 'queue-operation') {
    return { status: 'working', reason: 'processing prompt' }
  }
  if (s.lastStopReason === 'end_turn') {
    return { status: 'awaiting-input', reason: 'turn complete' }
  }
  return { status: 'unknown', reason: 'indeterminate' }
}
