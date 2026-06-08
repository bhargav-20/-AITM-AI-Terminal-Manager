import type { Terminal } from '@xterm/xterm'
import type { FitAddon } from '@xterm/addon-fit'
import { WebglAddon } from '@xterm/addon-webgl'
import { createTerminal } from './xtermConfig'
import type { PtyToRenderer, RendererToPty, SpawnTerminalRequest } from '@shared/ipc'

/**
 * Singleton that owns every xterm `Terminal` instance for the lifetime of its
 * session — NOT for the lifetime of a React component. React views attach/detach
 * to a terminal via `mount()`; terminals are only torn down by explicit `dispose()`.
 * This is what lets dockview re-parent, hide, split, and restore panels without
 * ever destroying a live terminal (and its scrollback + pty connection).
 */

export interface SpawnOptions {
  cwd: string
  shell?: string
  args?: string[]
  env?: Record<string, string>
  /** Optional command typed into the pty right after spawn (e.g. "claude\r"). */
  autorun?: string
}

interface Entry {
  id: string
  term: Terminal
  fit: FitAddon
  port?: MessagePort
  webgl?: WebglAddon
  element?: HTMLElement
  spawned: boolean
  exited: boolean
  exitCode?: number
  // backpressure accounting (approximate, by output char length)
  pending: number
  paused: boolean
  exitListeners: Set<(code: number) => void>
}

// Pause reading the pty when the renderer is this far behind; resume below LOW.
const HIGH_WATER = 1_000_000
const LOW_WATER = 200_000

class TerminalManagerImpl {
  private entries = new Map<string, Entry>()
  private orphanPorts = new Map<string, MessagePort>()

  constructor() {
    window.addEventListener('message', (e: MessageEvent) => {
      if (e.data && e.data.__atm === 'port' && e.ports[0]) {
        this.attachPort(e.data.terminalId as string, e.ports[0])
      }
    })
  }

  has(id: string): boolean {
    return this.entries.has(id)
  }

  getOrCreate(id: string): Entry {
    let entry = this.entries.get(id)
    if (!entry) {
      const { term, fit } = createTerminal()
      entry = {
        id,
        term,
        fit,
        spawned: false,
        exited: false,
        pending: 0,
        paused: false,
        exitListeners: new Set(),
      }
      this.entries.set(id, entry)
      const orphan = this.orphanPorts.get(id)
      if (orphan) {
        this.orphanPorts.delete(id)
        this.wirePort(entry, orphan)
      }
    }
    return entry
  }

  /** Attach the terminal to a DOM element (idempotent; never disposes). */
  mount(id: string, element: HTMLElement): void {
    const entry = this.getOrCreate(id)
    if (entry.element === element) {
      entry.fit.fit()
      return
    }
    entry.term.open(element)
    entry.element = element
    this.enableWebgl(entry)
    // defer fit until layout settles
    requestAnimationFrame(() => this.fit(id))
  }

  focus(id: string): void {
    this.entries.get(id)?.term.focus()
  }

  /** Resize the pty to match the fitted terminal. */
  fit(id: string): void {
    const entry = this.entries.get(id)
    if (!entry || !entry.element) return
    try {
      entry.fit.fit()
    } catch {
      return
    }
    const { cols, rows } = entry.term
    if (cols > 0 && rows > 0) this.send(entry, { type: 'r', cols, rows })
  }

  /** Spawn the backing pty for this terminal (no-op if already spawned). */
  async spawn(id: string, opts: SpawnOptions): Promise<void> {
    const entry = this.getOrCreate(id)
    if (entry.spawned) return
    entry.spawned = true
    const cols = entry.term.cols || 80
    const rows = entry.term.rows || 24
    const req: SpawnTerminalRequest = {
      terminalId: id,
      cwd: opts.cwd,
      shell: opts.shell,
      args: opts.args,
      env: opts.env,
      cols,
      rows,
    }
    await window.atm.spawnTerminal(req)
    if (opts.autorun) {
      // pty line discipline buffers this until the shell starts reading.
      this.send(entry, { type: 'i', data: opts.autorun })
    }
  }

  /** Programmatically send input to a terminal's pty. */
  input(id: string, data: string): void {
    const entry = this.entries.get(id)
    if (entry) this.send(entry, { type: 'i', data })
  }

  onExit(id: string, cb: (code: number) => void): () => void {
    const entry = this.getOrCreate(id)
    entry.exitListeners.add(cb)
    if (entry.exited) cb(entry.exitCode ?? 0)
    return () => entry.exitListeners.delete(cb)
  }

  dispose(id: string): void {
    const entry = this.entries.get(id)
    if (!entry) return
    window.atm.killTerminal(id).catch(() => undefined)
    try {
      entry.webgl?.dispose()
    } catch {
      /* ignore */
    }
    try {
      entry.port?.close()
    } catch {
      /* ignore */
    }
    entry.term.dispose()
    this.entries.delete(id)
  }

  // --- internals -----------------------------------------------------------

  private attachPort(id: string, port: MessagePort): void {
    const entry = this.entries.get(id)
    if (!entry) {
      this.orphanPorts.set(id, port)
      return
    }
    this.wirePort(entry, port)
  }

  private wirePort(entry: Entry, port: MessagePort): void {
    entry.port = port
    port.onmessage = (e: MessageEvent) => {
      const msg = e.data as PtyToRenderer
      if (msg.type === 'd') {
        const len = msg.data.length
        entry.pending += len
        if (!entry.paused && entry.pending > HIGH_WATER) {
          entry.paused = true
          this.send(entry, { type: 'p' })
        }
        entry.term.write(msg.data, () => {
          entry.pending -= len
          if (entry.paused && entry.pending < LOW_WATER) {
            entry.paused = false
            this.send(entry, { type: 'u' })
          }
        })
      } else if (msg.type === 'x') {
        entry.exited = true
        entry.exitCode = msg.code
        entry.term.write(`\r\n\x1b[2m[process exited • code ${msg.code}]\x1b[0m\r\n`)
        entry.exitListeners.forEach((cb) => cb(msg.code))
      }
    }
    port.start()
    entry.term.onData((data) => this.send(entry, { type: 'i', data }))
  }

  private enableWebgl(entry: Entry): void {
    if (entry.webgl) return
    try {
      const addon = new WebglAddon()
      addon.onContextLoss(() => {
        try {
          addon.dispose()
        } catch {
          /* ignore */
        }
        entry.webgl = undefined
      })
      entry.term.loadAddon(addon)
      entry.webgl = addon
    } catch {
      // WebGL unavailable (e.g. context cap reached) -> stay on the DOM renderer
    }
  }

  private send(entry: Entry, msg: RendererToPty): void {
    entry.port?.postMessage(msg)
  }
}

export const TerminalManager = new TerminalManagerImpl()
