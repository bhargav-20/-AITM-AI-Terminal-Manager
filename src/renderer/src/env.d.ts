/// <reference types="vite/client" />
import type { SpawnTerminalRequest, SpawnTerminalResult } from '@shared/ipc'
import type { ClaudeSession } from '@shared/claude'

declare global {
  interface Window {
    atm: {
      spawnTerminal(req: SpawnTerminalRequest): Promise<SpawnTerminalResult>
      killTerminal(terminalId: string): Promise<void>
      openExternal(url: string): Promise<void>
      resolveCommand(token: string): Promise<string | null>
      onMenuAction(cb: (action: string) => void): void
      claude: {
        getSnapshot(): Promise<ClaudeSession[]>
        onSnapshot(cb: (sessions: ClaudeSession[]) => void): () => void
      }
    }
  }
}

export {}
