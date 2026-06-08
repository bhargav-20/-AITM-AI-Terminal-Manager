import { promises as fs } from 'fs'
import { StringDecoder } from 'string_decoder'

// Incremental, byte-offset JSONL reader: returns only complete lines appended since
// the last call. Stashes a partial trailing line and uses a StringDecoder so a
// multi-byte UTF-8 char split across reads isn't corrupted. Handles truncation.

export interface TailState {
  offset: number
  partial: string
  decoder: StringDecoder
}

export function newTailState(): TailState {
  return { offset: 0, partial: '', decoder: new StringDecoder('utf8') }
}

export async function readNewLines(path: string, state: TailState): Promise<string[]> {
  let stat: import('fs').Stats
  try {
    stat = await fs.stat(path)
  } catch {
    return []
  }
  if (stat.size < state.offset) {
    // file truncated or replaced — start over
    state.offset = 0
    state.partial = ''
    state.decoder = new StringDecoder('utf8')
  }
  if (stat.size <= state.offset) return []

  const fh = await fs.open(path, 'r')
  try {
    const len = stat.size - state.offset
    const buf = Buffer.allocUnsafe(len)
    const { bytesRead } = await fh.read(buf, 0, len, state.offset)
    state.offset += bytesRead
    const text = state.partial + state.decoder.write(buf.subarray(0, bytesRead))
    const lines = text.split('\n')
    state.partial = lines.pop() ?? ''
    return lines
  } finally {
    await fh.close()
  }
}

/** Read an entire transcript's lines (used for the one-time snapshot of recent files). */
export async function readAllLines(path: string): Promise<string[]> {
  try {
    const text = await fs.readFile(path, 'utf8')
    const lines = text.split('\n')
    if (lines.length && lines[lines.length - 1] === '') lines.pop()
    return lines
  } catch {
    return []
  }
}
