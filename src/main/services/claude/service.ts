import { promises as fs } from 'fs'
import { join, relative, sep } from 'path'
import chokidar, { type FSWatcher } from 'chokidar'
import type { BrowserWindow } from 'electron'
import { CLAUDE_IPC, type ClaudeSession, type ClaudeTaskSummary } from '../../../shared/claude'
import { projectsDir, sessionIdFromTranscript } from './claudePaths'
import { parseLine } from './lineParser'
import { readNewLines, newTailState, type TailState } from './tailer'
import { addUsage, emptyUsage } from './usage'
import { computeStatus } from './statusMachine'
import { readRegistry, pidAlive, type RegistryEntry } from './registry'
import { readTaskSummary } from './tasks'

const RECENT_WINDOW_MS = 24 * 60 * 60 * 1000
const MAX_SESSIONS = 60
const POLL_MS = 4000
const EMIT_DEBOUNCE_MS = 250

interface Derived {
  usage: ReturnType<typeof emptyUsage>
  lastType?: string
  lastStopReason?: string
  awaitingReply: boolean
  lastActivityTs: number
  title?: string
  cwd?: string
  gitBranch?: string
  version?: string
  model?: string
}

interface SessionState {
  sessionId: string
  file: string
  tail: TailState
  derived: Derived
  tasks: ClaudeTaskSummary
}

const STATUS_ORDER: Record<string, number> = {
  working: 0,
  'awaiting-input': 1,
  idle: 2,
  unknown: 3,
  ended: 4,
}

export class ClaudeService {
  private window: BrowserWindow | null = null
  private states = new Map<string, SessionState>()
  private registry = new Map<string, RegistryEntry>()
  private watcher: FSWatcher | null = null
  private poll: ReturnType<typeof setInterval> | null = null
  private emitTimer: ReturnType<typeof setTimeout> | null = null

  setWindow(win: BrowserWindow): void {
    this.window = win
  }

  async start(): Promise<void> {
    this.registry = await readRegistry()
    await this.discover()
    this.watch()
    this.poll = setInterval(() => void this.tick(), POLL_MS)
    this.scheduleEmit()
  }

  stop(): void {
    this.watcher?.close()
    this.watcher = null
    if (this.poll) clearInterval(this.poll)
    if (this.emitTimer) clearTimeout(this.emitTimer)
  }

  snapshot(): ClaudeSession[] {
    const now = Date.now()
    const out: ClaudeSession[] = []
    for (const st of this.states.values()) {
      const inRegistry = this.registry.has(st.sessionId)
      if (!inRegistry && now - st.derived.lastActivityTs > RECENT_WINDOW_MS) continue
      out.push(this.build(st, now))
    }
    out.sort(
      (a, b) =>
        (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9) ||
        b.lastActivityTs - a.lastActivityTs,
    )
    return out.slice(0, MAX_SESSIONS)
  }

  // --- discovery & watching ------------------------------------------------

  private async discover(): Promise<void> {
    const root = projectsDir()
    let projects: string[]
    try {
      projects = await fs.readdir(root)
    } catch {
      return
    }
    const now = Date.now()
    for (const proj of projects) {
      const dir = join(root, proj)
      let entries: string[]
      try {
        const stat = await fs.stat(dir)
        if (!stat.isDirectory()) continue
        entries = await fs.readdir(dir)
      } catch {
        continue
      }
      for (const file of entries) {
        if (!file.endsWith('.jsonl')) continue
        const full = join(dir, file)
        let mtimeMs = 0
        try {
          mtimeMs = (await fs.stat(full)).mtimeMs
        } catch {
          continue
        }
        const sessionId = sessionIdFromTranscript(file)
        const recent = now - mtimeMs <= RECENT_WINDOW_MS
        if (!recent && !this.registry.has(sessionId)) continue
        await this.ingest(sessionId, full, mtimeMs)
      }
    }
  }

  private watch(): void {
    const root = projectsDir()
    this.watcher = chokidar.watch(root, { ignoreInitial: true, depth: 2 })
    const onChange = (path: string): void => {
      const rel = relative(root, path)
      const parts = rel.split(sep)
      // only top-level transcripts: <project>/<sessionId>.jsonl
      if (parts.length !== 2 || !parts[1].endsWith('.jsonl')) return
      void this.onTranscriptChange(path, sessionIdFromTranscript(parts[1]))
    }
    this.watcher.on('add', onChange)
    this.watcher.on('change', onChange)
    this.watcher.on('error', () => undefined)
  }

  private async onTranscriptChange(path: string, sessionId: string): Promise<void> {
    let state = this.states.get(sessionId)
    if (!state) {
      let mtimeMs = Date.now()
      try {
        mtimeMs = (await fs.stat(path)).mtimeMs
      } catch {
        /* use now */
      }
      await this.ingest(sessionId, path, mtimeMs)
      state = this.states.get(sessionId)
    } else {
      const lines = await readNewLines(path, state.tail)
      this.processLines(state, lines)
    }
    if (state) state.tasks = await readTaskSummary(sessionId)
    this.scheduleEmit()
  }

  /** First read of a session: position the tail and fold all existing lines. */
  private async ingest(sessionId: string, file: string, mtimeMs: number): Promise<void> {
    const state: SessionState = {
      sessionId,
      file,
      tail: newTailState(),
      derived: { usage: emptyUsage(), awaitingReply: false, lastActivityTs: mtimeMs },
      tasks: { total: 0, completed: 0, inProgress: 0 },
    }
    const lines = await readNewLines(file, state.tail)
    this.processLines(state, lines)
    state.tasks = await readTaskSummary(sessionId)
    this.states.set(sessionId, state)
  }

  private processLines(state: SessionState, lines: string[]): void {
    const d = state.derived
    for (const line of lines) {
      const p = parseLine(line)
      if (!p) continue
      if (p.timestampMs) d.lastActivityTs = Math.max(d.lastActivityTs, p.timestampMs)
      if (p.cwd) d.cwd = p.cwd
      if (p.gitBranch) d.gitBranch = p.gitBranch
      if (p.version) d.version = p.version
      if (p.aiTitle) d.title = p.aiTitle
      if (p.model) d.model = p.model
      if (p.usage) addUsage(d.usage, p.usage, p.model)
      if (p.type === 'assistant') {
        d.lastType = 'assistant'
        d.lastStopReason = p.stopReason
        d.awaitingReply = false
      } else if (p.type === 'user') {
        d.lastType = 'user'
        d.lastStopReason = undefined
        d.awaitingReply = true
      } else if (p.type === 'queue-operation' && p.queueOp === 'enqueue') {
        d.lastType = 'queue-operation'
        d.awaitingReply = true
      }
    }
  }

  private async tick(): Promise<void> {
    this.registry = await readRegistry()
    this.scheduleEmit()
  }

  // --- build & emit --------------------------------------------------------

  private build(state: SessionState, now: number): ClaudeSession {
    const reg = this.registry.get(state.sessionId)
    const { status, reason } = computeStatus(
      {
        pidKnown: !!reg,
        pidAlive: reg ? pidAlive(reg.pid) : undefined,
        lastType: state.derived.lastType,
        lastStopReason: state.derived.lastStopReason,
        awaitingReply: state.derived.awaitingReply,
        lastActivityTs: state.derived.lastActivityTs,
      },
      now,
    )
    return {
      sessionId: state.sessionId,
      cwd: state.derived.cwd ?? reg?.cwd ?? '',
      title: state.derived.title,
      gitBranch: state.derived.gitBranch,
      version: state.derived.version ?? reg?.version,
      entrypoint: reg?.entrypoint,
      model: state.derived.model,
      pid: reg?.pid,
      status,
      statusReason: reason,
      lastActivityTs: state.derived.lastActivityTs,
      startedAt: reg?.startedAt,
      usage: state.derived.usage,
      tasks: state.tasks,
    }
  }

  private scheduleEmit(): void {
    if (this.emitTimer) return
    this.emitTimer = setTimeout(() => {
      this.emitTimer = null
      if (this.window && !this.window.isDestroyed()) {
        this.window.webContents.send(CLAUDE_IPC.snapshot, this.snapshot())
      }
    }, EMIT_DEBOUNCE_MS)
  }
}

export const claudeService = new ClaudeService()
