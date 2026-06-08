import type { DockviewApi } from 'dockview'

// Module-level handle to the live DockviewApi so non-React command code
// (spawn/close/focus) can manipulate the layout without prop drilling.
let api: DockviewApi | null = null

export function setDockApi(a: DockviewApi | null): void {
  api = a
}

export function getDockApi(): DockviewApi | null {
  return api
}
