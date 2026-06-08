import type { ClaudeUsage } from '../../../shared/claude'
import type { RawUsage } from './lineParser'

// Main only accumulates raw token totals; cost is derived in the renderer from
// user-editable rates (so rates can change without re-reading transcripts).

export function emptyUsage(): ClaudeUsage {
  return {
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationInputTokens: 0,
    cacheReadInputTokens: 0,
  }
}

/** Fold one assistant line's usage into the running total (mutates + returns). */
export function addUsage(acc: ClaudeUsage, usage: RawUsage): ClaudeUsage {
  acc.inputTokens += usage.input_tokens ?? 0
  acc.outputTokens += usage.output_tokens ?? 0
  acc.cacheCreationInputTokens += usage.cache_creation_input_tokens ?? 0
  acc.cacheReadInputTokens += usage.cache_read_input_tokens ?? 0
  return acc
}
