// Control-plane IPC contract shared by main, preload, and renderer.
// The high-throughput data plane (pty bytes <-> xterm) flows over a per-terminal
// MessagePort and is defined by the PortMessage types below, not by ipcMain channels.

export interface SpawnTerminalRequest {
  terminalId: string
  cwd: string
  /** Command to run. Defaults to the user's login shell. */
  shell?: string
  args?: string[]
  cols: number
  rows: number
  env?: Record<string, string>
}

export interface SpawnTerminalResult {
  terminalId: string
  pid: number
}

/** Control-plane channel names (ipcMain.handle / ipcRenderer.invoke). */
export const IPC = {
  spawnTerminal: 'terminal:spawn',
  killTerminal: 'terminal:kill',
  resizeTerminal: 'terminal:resize',
  /** main -> renderer: delivers the transferred MessagePort for a spawned terminal. */
  terminalPort: 'terminal:port',
} as const

/** Messages the pty-host sends to the renderer over the per-terminal port. */
export type PtyToRenderer =
  | { type: 'd'; data: string } // batched pty output
  | { type: 'x'; code: number; signal?: number } // pty exited

/** Messages the renderer sends to the pty-host over the per-terminal port. */
export type RendererToPty =
  | { type: 'i'; data: string } // user input
  | { type: 'r'; cols: number; rows: number } // resize
  | { type: 'p' } // pause (renderer backpressure: stop reading the pty)
  | { type: 'u' } // resume
