import { contextBridge, ipcRenderer } from 'electron'
import { IPC, type SpawnTerminalRequest } from '../shared/ipc'
import { CLAUDE_IPC, type ClaudeSession } from '../shared/claude'

const MENU_CHANNELS = [
  'menu:newTerminal',
  'menu:newClaude',
  'menu:closeActive',
  'menu:forceCloseActive',
] as const

// Control-plane API exposed to the renderer's main world.
const api = {
  spawnTerminal: (req: SpawnTerminalRequest) => ipcRenderer.invoke(IPC.spawnTerminal, req),
  killTerminal: (terminalId: string) => ipcRenderer.invoke(IPC.killTerminal, terminalId),
  openExternal: (url: string) => ipcRenderer.invoke('app:openExternal', url),
  resolveCommand: (token: string) => ipcRenderer.invoke('app:resolveCommand', token),
  onMenuAction: (cb: (action: string) => void): void => {
    for (const ch of MENU_CHANNELS) ipcRenderer.on(ch, () => cb(ch))
  },
  claude: {
    getSnapshot: (): Promise<ClaudeSession[]> => ipcRenderer.invoke(CLAUDE_IPC.getSnapshot),
    onSnapshot: (cb: (sessions: ClaudeSession[]) => void): (() => void) => {
      const listener = (_e: unknown, sessions: ClaudeSession[]): void => cb(sessions)
      ipcRenderer.on(CLAUDE_IPC.snapshot, listener)
      return () => ipcRenderer.removeListener(CLAUDE_IPC.snapshot, listener)
    },
  },
}

// MessagePorts cannot cross the contextBridge directly, so when the main process
// transfers a per-terminal port we forward it into the main world via
// window.postMessage (which preserves the transferable). Renderer code listens for
// the '__atm:port' message and wires the port to the matching xterm instance.
ipcRenderer.on(IPC.terminalPort, (event, payload: { terminalId: string }) => {
  window.postMessage({ __atm: 'port', terminalId: payload.terminalId }, '*', event.ports)
})

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('atm', api)
} else {
  ;(window as unknown as { atm: typeof api }).atm = api
}
