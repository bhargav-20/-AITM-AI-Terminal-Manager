import type { ClaudeUsage } from '../../../shared/claude'
import type { RawUsage } from './lineParser'

// Approximate per-million-token USD rates by model family. Estimates only —
// configurable later. cache-read is much cheaper; cache-write a premium over input.
interface Rate {
  input: number
  output: number
  cacheWrite: number
  cacheRead: number
}

const RATES: Array<{ match: RegExp; rate: Rate }> = [
  { match: /opus/i, rate: { input: 15, output: 75, cacheWrite: 18.75, cacheRead: 1.5 } },
  { match: /sonnet/i, rate: { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 } },
  { match: /haiku/i, rate: { input: 0.8, output: 4, cacheWrite: 1.0, cacheRead: 0.08 } },
]

function rateFor(model?: string): Rate {
  if (model) {
    for (const r of RATES) if (r.match.test(model)) return r.rate
  }
  return RATES[1].rate // default to sonnet-class
}

export function emptyUsage(): ClaudeUsage {
  return {
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationInputTokens: 0,
    cacheReadInputTokens: 0,
    estimatedCostUsd: 0,
  }
}

/** Fold one assistant line's usage into the running total (mutates + returns). */
export function addUsage(acc: ClaudeUsage, usage: RawUsage, model?: string): ClaudeUsage {
  const i = usage.input_tokens ?? 0
  const o = usage.output_tokens ?? 0
  const cw = usage.cache_creation_input_tokens ?? 0
  const cr = usage.cache_read_input_tokens ?? 0
  acc.inputTokens += i
  acc.outputTokens += o
  acc.cacheCreationInputTokens += cw
  acc.cacheReadInputTokens += cr
  const r = rateFor(model)
  acc.estimatedCostUsd +=
    (i * r.input + o * r.output + cw * r.cacheWrite + cr * r.cacheRead) / 1_000_000
  return acc
}
