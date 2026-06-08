import { promises as fs } from 'fs'
import { join } from 'path'
import { tasksDir } from './claudePaths'
import type { ClaudeTaskSummary } from '../../../shared/claude'

/** Summarize ~/.claude/tasks/<sessionId>/*.json into counts. */
export async function readTaskSummary(sessionId: string): Promise<ClaudeTaskSummary> {
  const summary: ClaudeTaskSummary = { total: 0, completed: 0, inProgress: 0 }
  let files: string[]
  try {
    files = await fs.readdir(tasksDir(sessionId))
  } catch {
    return summary
  }
  await Promise.all(
    files
      .filter((f) => f.endsWith('.json'))
      .map(async (f) => {
        try {
          const raw = await fs.readFile(join(tasksDir(sessionId), f), 'utf8')
          const j = JSON.parse(raw)
          if (j && typeof j.status === 'string') {
            summary.total += 1
            if (j.status === 'completed') summary.completed += 1
            else if (j.status === 'in_progress') summary.inProgress += 1
          }
        } catch {
          /* skip */
        }
      }),
  )
  return summary
}
