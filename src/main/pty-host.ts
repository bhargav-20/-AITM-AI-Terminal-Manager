// Utility process that owns all node-pty instances.
// It receives one MessagePortMain per terminal (brokered by the main process) and
// streams pty output directly to the renderer over that port — the main process is
// never in the data path. Output is coalesced (batched) and flow-controlled.

import * as os from 'os'
import * as pty from 'node-pty'
import type { SpawnTerminalRequest } from '../shared/ipc'

// Electron's MessagePortMain isn't exported as a value here; type loosely.
type Port = {
  postMessage(message: unknown): void
  on(event: 'message', listener: (e: { data: any; ports: Port[] }) => void): void
  start(): void
  close(): void
}

interface Session {
  pty: pty.IPty
  port: Port
  buf: string
  flushTimer: ReturnType<typeof setTimeout> | null
  paused: boolean
}

const sessions = new Map<string, Session>()
const FLUSH_MS = 8

const parentPort = (process as unknown as { parentPort: Port }).parentPort

parentPort.on('message', (e) => {
  const msg = e.data
  if (msg?.type === 'spawn') {
    spawn(msg.req as SpawnTerminalRequest, e.ports[0])
  } else if (msg?.type === 'kill') {
    kill(msg.terminalId as string)
  }
})

function defaultShell(): string {
  if (os.platform() === 'win32') return process.env.COMSPEC || 'powershell.exe'
  return process.env.SHELL || '/bin/zsh'
}

function spawn(req: SpawnTerminalRequest, port: Port): void {
  let p: pty.IPty
  try {
    p = pty.spawn(req.shell || defaultShell(), req.args ?? [], {
      name: 'xterm-256color',
      cols: req.cols,
      rows: req.rows,
      cwd: req.cwd || os.homedir(),
      env: { ...process.env, ...(req.env ?? {}), TERM: 'xterm-256color' } as Record<string, string>,
    })
  } catch (err) {
    parentPort.postMessage({ type: 'spawn-error', terminalId: req.terminalId, error: String(err) })
    return
  }

  const session: Session = { pty: p, port, buf: '', flushTimer: null, paused: false }
  sessions.set(req.terminalId, session)

  p.onData((data) => {
    session.buf += data
    scheduleFlush(session)
  })

  p.onExit(({ exitCode, signal }) => {
    flush(session)
    try {
      port.postMessage({ type: 'x', code: exitCode, signal })
    } catch {
      /* port may be closed */
    }
    sessions.delete(req.terminalId)
  })

  port.on('message', (ev) => {
    const m = ev.data
    if (!m) return
    switch (m.type) {
      case 'i':
        p.write(m.data)
        break
      case 'r':
        try {
          p.resize(m.cols, m.rows)
        } catch {
          /* resize can throw if pty already exited */
        }
        break
      case 'p':
        if (!session.paused) {
          session.paused = true
          p.pause()
        }
        break
      case 'u':
        if (session.paused) {
          session.paused = false
          p.resume()
        }
        break
    }
  })
  port.start()

  parentPort.postMessage({ type: 'spawned', terminalId: req.terminalId, pid: p.pid })
}

function scheduleFlush(s: Session): void {
  if (s.flushTimer) return
  s.flushTimer = setTimeout(() => flush(s), FLUSH_MS)
}

function flush(s: Session): void {
  if (s.flushTimer) {
    clearTimeout(s.flushTimer)
    s.flushTimer = null
  }
  if (s.buf.length === 0) return
  const data = s.buf
  s.buf = ''
  try {
    s.port.postMessage({ type: 'd', data })
  } catch {
    /* port closed */
  }
}

function kill(terminalId: string): void {
  const s = sessions.get(terminalId)
  if (!s) return
  try {
    s.pty.kill()
  } catch {
    /* already dead */
  }
  sessions.delete(terminalId)
}
