export interface GitDiffResult {
  isRepo: boolean
  repoRoot?: string
  /** Unified diff of the working tree vs HEAD (tracked changes). */
  diff: string
  changedFiles: number
  untracked: string[]
}

export interface OpenResult {
  ok: boolean
  error?: string
}

export const GIT_IPC = {
  diff: 'git:diff',
  openInVSCode: 'git:openInVSCode',
} as const
