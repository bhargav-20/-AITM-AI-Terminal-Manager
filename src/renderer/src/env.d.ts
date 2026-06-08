/// <reference types="vite/client" />
import type { SpawnTerminalRequest, SpawnTerminalResult } from '@shared/ipc'
import type { ClaudeSession } from '@shared/claude'
import type { GitDiffResult, OpenResult } from '@shared/git'

declare global {
  interface Window {
    atm: {
      homeDir: string
      spawnTerminal(req: SpawnTerminalRequest): Promise<SpawnTerminalResult>
      killTerminal(terminalId: string): Promise<void>
      openExternal(url: string): Promise<void>
      resolveCommand(token: string): Promise<string | null>
      setNotificationsEnabled(enabled: boolean): Promise<void>
      onMenuAction(cb: (action: string) => void): void
      onFocusSession(cb: (sessionId: string) => void): () => void
      claude: {
        getSnapshot(): Promise<ClaudeSession[]>
        onSnapshot(cb: (sessions: ClaudeSession[]) => void): () => void
      }
      git: {
        diff(cwd: string): Promise<GitDiffResult>
        openInVSCode(cwd: string): Promise<OpenResult>
      }
    }
  }
}

export {}
