import type { ClaudeStatus } from '@shared/claude'

export const CLAUDE_STATUS_COLOR: Record<ClaudeStatus, string> = {
  working: '#6ea8fe',
  'awaiting-input': '#e2b66d',
  idle: '#8a90a0',
  ended: '#4a4f5c',
  unknown: '#5a6172',
}

export const CLAUDE_STATUS_LABEL: Record<ClaudeStatus, string> = {
  working: 'Working',
  'awaiting-input': 'Awaiting input',
  idle: 'Idle',
  ended: 'Ended',
  unknown: 'Unknown',
}
