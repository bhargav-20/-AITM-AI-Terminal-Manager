import { getDockApi } from '../layout/dockApi'

let counter = 0
const openByCwd = new Map<string, string>() // cwd -> panelId

/** Open (or focus an existing) diff panel for a repo cwd. */
export function openDiff(cwd: string, label?: string): void {
  const api = getDockApi()
  if (!api) return

  const existingId = openByCwd.get(cwd)
  if (existingId) {
    const panel = api.getPanel(existingId)
    if (panel) {
      panel.api.setActive()
      return
    }
    openByCwd.delete(cwd)
  }

  counter += 1
  const id = `diff-${Date.now().toString(36)}${counter}`
  openByCwd.set(cwd, id)
  api.addPanel({
    id,
    component: 'diff',
    title: `Diff · ${label || 'repo'}`,
    params: { cwd, label },
  })
}
