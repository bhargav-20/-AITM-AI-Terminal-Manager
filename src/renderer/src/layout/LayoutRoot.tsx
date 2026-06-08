import { DockviewReact, type DockviewReadyEvent, themeAbyss } from 'dockview'
import 'dockview/dist/styles/dockview.css'
import { TerminalPanel } from './TerminalPanel'
import { DiffPanel } from '../diff/DiffPanel'
import { CustomTab } from './CustomTab'
import { setDockApi } from './dockApi'
import { useStore } from '../state/store'
import { cleanupSession, spawnSession } from '../commands/sessions'
import { persistLayout, loadLayout } from './persistence'

const components = { terminal: TerminalPanel, diff: DiffPanel }
const tabComponents = { custom: CustomTab }

export function LayoutRoot(): React.JSX.Element {
  const onReady = (event: DockviewReadyEvent): void => {
    const api = event.api
    setDockApi(api)

    const store = useStore.getState()
    const saved = loadLayout()
    const haveSessions = store.order.length > 0

    // 1. Restore panel positions from the saved layout (if any).
    if (saved && haveSessions) {
      try {
        api.fromJSON(saved as Parameters<typeof api.fromJSON>[0])
      } catch (e) {
        console.error('layout restore failed; rebuilding from sessions', e)
      }
    }

    // 2. Reconcile: ensure every persisted session has a panel (handles a saved
    //    store with a missing/partial layout, and respawns dead ptys on launch).
    for (const id of store.order) {
      if (api.getPanel(id)) continue
      const s = store.sessions[id]
      if (!s) continue
      api.addPanel({
        id,
        component: 'terminal',
        tabComponent: 'custom',
        title: s.title,
        params: { terminalId: id },
      })
    }

    // 3. Nothing to show -> seed a first terminal.
    if (api.panels.length === 0) {
      spawnSession({ kind: 'shell', title: 'zsh' })
    }

    api.onDidActivePanelChange((panel) => useStore.getState().setActive(panel?.id ?? null))
    api.onDidRemovePanel((panel) => cleanupSession(panel.id))
    api.onDidLayoutChange(() => persistLayout(api))
  }

  return (
    <DockviewReact
      className="atm-dockview"
      theme={themeAbyss}
      components={components}
      tabComponents={tabComponents}
      onReady={onReady}
    />
  )
}
