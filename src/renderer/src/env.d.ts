/// <reference types="vite/client" />
import type { SpawnTerminalRequest, SpawnTerminalResult } from '@shared/ipc'

declare global {
  interface Window {
    atm: {
      spawnTerminal(req: SpawnTerminalRequest): Promise<SpawnTerminalResult>
      killTerminal(terminalId: string): Promise<void>
      openExternal(url: string): Promise<void>
      onMenuAction(cb: (action: string) => void): void
    }
  }
}

export {}
