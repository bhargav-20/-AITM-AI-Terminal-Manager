// Shared contract for the Claude awareness service (main) <-> renderer.

export type ClaudeStatus = 'working' | 'awaiting-input' | 'idle' | 'ended' | 'unknown'

export interface ClaudeUsage {
  inputTokens: number
  outputTokens: number
  cacheCreationInputTokens: number
  cacheReadInputTokens: number
  estimatedCostUsd: number
}

export interface ClaudeTaskSummary {
  total: number
  completed: number
  inProgress: number
}

export interface ClaudeSession {
  sessionId: string
  cwd: string
  title?: string
  gitBranch?: string
  version?: string
  entrypoint?: string
  model?: string
  pid?: number
  status: ClaudeStatus
  statusReason: string
  /** ms epoch of the most recent transcript activity. */
  lastActivityTs: number
  startedAt?: number
  usage: ClaudeUsage
  tasks: ClaudeTaskSummary
}

export const CLAUDE_IPC = {
  /** renderer -> main: full current snapshot. */
  getSnapshot: 'claude:getSnapshot',
  /** main -> renderer: pushed full snapshot (debounced) on any change. */
  snapshot: 'claude:snapshot',
} as const
