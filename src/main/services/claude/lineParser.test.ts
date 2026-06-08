import { describe, it, expect } from 'vitest'
import { parseLine } from './lineParser'

describe('parseLine', () => {
  it('returns null for blank, garbage, or typeless lines', () => {
    expect(parseLine('')).toBeNull()
    expect(parseLine('   ')).toBeNull()
    expect(parseLine('not json')).toBeNull()
    expect(parseLine('{"no":"type"}')).toBeNull()
  })

  it('parses an assistant line with usage + stop_reason + model', () => {
    const line = JSON.stringify({
      type: 'assistant',
      timestamp: '2026-06-08T15:27:10.599Z',
      cwd: '/Users/x/proj',
      gitBranch: 'main',
      version: '2.1.160',
      message: {
        role: 'assistant',
        model: 'claude-opus-4-8',
        stop_reason: 'tool_use',
        usage: {
          input_tokens: 2,
          output_tokens: 578,
          cache_creation_input_tokens: 5883,
          cache_read_input_tokens: 19977,
        },
      },
    })
    const p = parseLine(line)!
    expect(p.type).toBe('assistant')
    expect(p.stopReason).toBe('tool_use')
    expect(p.model).toBe('claude-opus-4-8')
    expect(p.usage?.output_tokens).toBe(578)
    expect(p.cwd).toBe('/Users/x/proj')
    expect(p.gitBranch).toBe('main')
    expect(p.timestampMs).toBe(Date.parse('2026-06-08T15:27:10.599Z'))
  })

  it('parses ai-title, queue-operation, and user lines', () => {
    expect(parseLine(JSON.stringify({ type: 'ai-title', aiTitle: 'Build X' }))!.aiTitle).toBe('Build X')
    expect(parseLine(JSON.stringify({ type: 'queue-operation', operation: 'enqueue' }))!.queueOp).toBe(
      'enqueue',
    )
    expect(parseLine(JSON.stringify({ type: 'user', message: { role: 'user', content: 'hi' } }))!.role).toBe(
      'user',
    )
  })
})
