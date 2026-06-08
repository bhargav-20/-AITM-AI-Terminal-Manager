import { homedir } from 'os'
import { join } from 'path'

export function claudeDir(): string {
  return process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude')
}

export function projectsDir(): string {
  return join(claudeDir(), 'projects')
}

export function sessionsDir(): string {
  return join(claudeDir(), 'sessions')
}

export function tasksDir(sessionId: string): string {
  return join(claudeDir(), 'tasks', sessionId)
}

/** sessionId = the .jsonl filename stem. */
export function sessionIdFromTranscript(file: string): string {
  return file.replace(/\.jsonl$/, '')
}
