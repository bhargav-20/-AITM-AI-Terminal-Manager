import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { GitDiffResult, OpenResult } from '../../shared/git'

const exec = promisify(execFile)

async function repoRoot(cwd: string): Promise<string | null> {
  if (!cwd) return null
  try {
    const { stdout } = await exec('git', ['-C', cwd, 'rev-parse', '--show-toplevel'], {
      maxBuffer: 1024 * 1024,
    })
    return stdout.trim() || null
  } catch {
    return null
  }
}

/** Resolve a command's absolute path on the user's interactive-login PATH. */
async function resolveOnPath(cmd: string): Promise<string | null> {
  const shellPath = process.env.SHELL || '/bin/zsh'
  try {
    const { stdout } = await exec(shellPath, ['-lic', `command -v ${cmd} 2>/dev/null`], {
      timeout: 5000,
    })
    return stdout.trim().split('\n')[0] || null
  } catch {
    return null
  }
}

export async function getDiff(cwd: string): Promise<GitDiffResult> {
  const root = await repoRoot(cwd)
  if (!root) return { isRepo: false, diff: '', changedFiles: 0, untracked: [] }

  let diff = ''
  try {
    const { stdout } = await exec('git', ['-C', root, '--no-pager', 'diff', 'HEAD'], {
      maxBuffer: 64 * 1024 * 1024,
    })
    diff = stdout
  } catch {
    // repo may have no commits yet — fall back to a plain working-tree diff
    try {
      const { stdout } = await exec('git', ['-C', root, '--no-pager', 'diff'], {
        maxBuffer: 64 * 1024 * 1024,
      })
      diff = stdout
    } catch {
      /* leave diff empty */
    }
  }

  const untracked: string[] = []
  let changedFiles = 0
  try {
    const { stdout } = await exec('git', ['-C', root, 'status', '--porcelain'], {
      maxBuffer: 8 * 1024 * 1024,
    })
    for (const line of stdout.split('\n')) {
      if (!line.trim()) continue
      changedFiles += 1
      if (line.startsWith('??')) untracked.push(line.slice(3))
    }
  } catch {
    /* ignore */
  }

  return { isRepo: true, repoRoot: root, diff, changedFiles, untracked }
}

export async function openInVSCode(cwd: string): Promise<OpenResult> {
  const target = (await repoRoot(cwd)) ?? cwd
  if (!target) return { ok: false, error: 'No folder to open.' }
  const code = await resolveOnPath('code')
  if (!code) {
    return {
      ok: false,
      error: '`code` not found on PATH. In VS Code: Cmd+Shift+P → "Shell Command: Install \'code\' command".',
    }
  }
  try {
    await exec(code, [target], { timeout: 8000 })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}
