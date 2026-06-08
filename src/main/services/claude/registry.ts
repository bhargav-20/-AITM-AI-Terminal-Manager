import { promises as fs } from 'fs'
import { join } from 'path'
import { sessionsDir } from './claudePaths'

export interface RegistryEntry {
  pid: number
  sessionId: string
  cwd?: string
  entrypoint?: string
  version?: string
  startedAt?: number
}

/** Read ~/.claude/sessions/*.json into a map keyed by sessionId. */
export async function readRegistry(): Promise<Map<string, RegistryEntry>> {
  const map = new Map<string, RegistryEntry>()
  let files: string[]
  try {
    files = await fs.readdir(sessionsDir())
  } catch {
    return map
  }
  await Promise.all(
    files
      .filter((f) => f.endsWith('.json'))
      .map(async (f) => {
        try {
          const raw = await fs.readFile(join(sessionsDir(), f), 'utf8')
          const j = JSON.parse(raw)
          if (j && typeof j.sessionId === 'string' && typeof j.pid === 'number') {
            map.set(j.sessionId, {
              pid: j.pid,
              sessionId: j.sessionId,
              cwd: typeof j.cwd === 'string' ? j.cwd : undefined,
              entrypoint: typeof j.entrypoint === 'string' ? j.entrypoint : undefined,
              version: typeof j.version === 'string' ? j.version : undefined,
              startedAt: typeof j.startedAt === 'number' ? j.startedAt : undefined,
            })
          }
        } catch {
          /* skip unreadable / partial files */
        }
      }),
  )
  return map
}

/** True if the process is alive. EPERM means it exists but we can't signal it. */
export function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === 'EPERM'
  }
}
