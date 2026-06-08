import type { ClaudeSession, ClaudeUsage } from '@shared/claude'
import type { RateMap, RateModel, SessionMetric } from '../state/store'

function familyFor(model?: string): RateModel {
  if (model) {
    if (/opus/i.test(model)) return 'opus'
    if (/haiku/i.test(model)) return 'haiku'
    if (/sonnet/i.test(model)) return 'sonnet'
  }
  return 'sonnet'
}

export function costUsd(usage: ClaudeUsage, model: string | undefined, rates: RateMap): number {
  const r = rates[familyFor(model)]
  return (
    (usage.inputTokens * r.input +
      usage.outputTokens * r.output +
      usage.cacheCreationInputTokens * r.cacheWrite +
      usage.cacheReadInputTokens * r.cacheRead) /
    1_000_000
  )
}

export function totalTokens(usage: ClaudeUsage): number {
  return (
    usage.inputTokens +
    usage.outputTokens +
    usage.cacheCreationInputTokens +
    usage.cacheReadInputTokens
  )
}

function fmtCost(n: number): string {
  if (n >= 0.01) return `$${n.toFixed(2)}`
  if (n > 0) return '<$0.01'
  return '$0'
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return `${n}`
}

/** The metric string shown on a session row, or null when display is off. */
export function metricLabel(
  session: ClaudeSession,
  metric: SessionMetric,
  rates: RateMap,
): string | null {
  if (metric === 'off') return null
  if (metric === 'tokens') return `${fmtTokens(totalTokens(session.usage))} tok`
  return fmtCost(costUsd(session.usage, session.model, rates))
}
