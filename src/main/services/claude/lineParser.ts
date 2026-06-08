// Minimal, defensive parse of one Claude transcript JSONL line into the fields the
// UI cares about. Returns null for blank/unparseable lines (never throws).

export interface RawUsage {
  input_tokens?: number
  output_tokens?: number
  cache_creation_input_tokens?: number
  cache_read_input_tokens?: number
}

export interface ParsedLine {
  type: string
  role?: string
  stopReason?: string
  model?: string
  usage?: RawUsage
  aiTitle?: string
  queueOp?: 'enqueue' | 'dequeue'
  cwd?: string
  gitBranch?: string
  version?: string
  timestampMs?: number
  hookEvent?: string
}

export function parseLine(line: string): ParsedLine | null {
  const trimmed = line.trim()
  if (!trimmed) return null
  let obj: Record<string, unknown>
  try {
    obj = JSON.parse(trimmed)
  } catch {
    return null
  }
  if (!obj || typeof obj !== 'object' || typeof obj.type !== 'string') return null

  const out: ParsedLine = { type: obj.type }
  const ts = obj.timestamp
  if (typeof ts === 'string') {
    const ms = Date.parse(ts)
    if (!Number.isNaN(ms)) out.timestampMs = ms
  }
  if (typeof obj.cwd === 'string') out.cwd = obj.cwd
  if (typeof obj.gitBranch === 'string') out.gitBranch = obj.gitBranch
  if (typeof obj.version === 'string') out.version = obj.version

  const message = obj.message as Record<string, unknown> | undefined
  if (obj.type === 'assistant' && message) {
    out.role = 'assistant'
    if (typeof message.model === 'string') out.model = message.model
    if (typeof message.stop_reason === 'string') out.stopReason = message.stop_reason
    if (message.usage && typeof message.usage === 'object') out.usage = message.usage as RawUsage
  } else if (obj.type === 'user') {
    out.role = 'user'
  } else if (obj.type === 'ai-title' && typeof obj.aiTitle === 'string') {
    out.aiTitle = obj.aiTitle
  } else if (obj.type === 'queue-operation') {
    const op = obj.operation
    if (op === 'enqueue' || op === 'dequeue') out.queueOp = op
  } else if (obj.type === 'attachment') {
    const att = obj.attachment as Record<string, unknown> | undefined
    if (att && typeof att.hookEvent === 'string') out.hookEvent = att.hookEvent
  }
  return out
}
