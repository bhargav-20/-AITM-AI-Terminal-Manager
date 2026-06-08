import { describe, it, expect } from 'vitest'
import { computeStatus, IDLE_MS } from './statusMachine'

const now = 1_000_000_000_000
const recent = now - 1000

describe('computeStatus', () => {
  it('dead pid -> ended', () => {
    const r = computeStatus({ pidKnown: true, pidAlive: false, awaitingReply: false, lastActivityTs: recent }, now)
    expect(r.status).toBe('ended')
  })

  it('mid-tool-use recently -> working', () => {
    const r = computeStatus({ pidKnown: false, lastStopReason: 'tool_use', awaitingReply: false, lastActivityTs: recent }, now)
    expect(r.status).toBe('working')
  })

  it('unanswered user prompt -> working', () => {
    const r = computeStatus({ pidKnown: false, lastType: 'user', awaitingReply: true, lastActivityTs: recent }, now)
    expect(r.status).toBe('working')
  })

  it('completed turn recently -> awaiting-input', () => {
    const r = computeStatus({ pidKnown: false, lastStopReason: 'end_turn', awaitingReply: false, lastActivityTs: recent }, now)
    expect(r.status).toBe('awaiting-input')
  })

  it('stale activity -> idle', () => {
    const r = computeStatus({ pidKnown: false, lastStopReason: 'end_turn', awaitingReply: false, lastActivityTs: now - IDLE_MS - 1 }, now)
    expect(r.status).toBe('idle')
  })

  it('dead pid takes priority over staleness', () => {
    const r = computeStatus({ pidKnown: true, pidAlive: false, awaitingReply: false, lastActivityTs: now - IDLE_MS - 1 }, now)
    expect(r.status).toBe('ended')
  })

  it('alive registered session with no signal -> unknown', () => {
    const r = computeStatus({ pidKnown: true, pidAlive: true, awaitingReply: false, lastActivityTs: recent }, now)
    expect(r.status).toBe('unknown')
  })
})
