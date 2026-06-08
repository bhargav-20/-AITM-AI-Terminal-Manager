import type { DockviewApi } from 'dockview'

// Phase 1 persists the dockview layout to localStorage; this migrates to
// userData/workspace.json (via main) in the persistence-hardening pass.
const LAYOUT_KEY = 'atm-layout'

export function persistLayout(api: DockviewApi): void {
  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(api.toJSON()))
  } catch (e) {
    console.error('persistLayout failed', e)
  }
}

export function loadLayout(): object | null {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY)
    return raw ? (JSON.parse(raw) as object) : null
  } catch {
    return null
  }
}

export function clearLayout(): void {
  localStorage.removeItem(LAYOUT_KEY)
}
