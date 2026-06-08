import { create } from 'zustand'
import type { ClaudeSession } from '@shared/claude'

// Read-only mirror of the main-process ClaudeService snapshot (not persisted).
interface ClaudeState {
  sessions: ClaudeSession[]
  setSessions: (sessions: ClaudeSession[]) => void
}

export const useClaudeStore = create<ClaudeState>((set) => ({
  sessions: [],
  setSessions: (sessions) => set({ sessions }),
}))
