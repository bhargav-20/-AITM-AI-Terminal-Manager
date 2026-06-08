import { useEffect } from 'react'
import { Sidebar } from './sidebar/Sidebar'
import { LayoutRoot } from './layout/LayoutRoot'
import { Toast } from './ui/Toast'
import { toast } from './ui/toastBus'
import { spawnSession, closeActiveSession } from './commands/sessions'

export function App(): React.JSX.Element {
  useEffect(() => {
    window.atm.onMenuAction((action) => {
      switch (action) {
        case 'menu:newTerminal':
          spawnSession({ kind: 'shell' })
          break
        case 'menu:newClaude':
          spawnSession({ kind: 'claude' })
          break
        case 'menu:closeActive':
          if (!closeActiveSession(false)) toast('Tab is pinned — ⇧⌘W to force close')
          break
        case 'menu:forceCloseActive':
          closeActiveSession(true)
          break
      }
    })
  }, [])

  return (
    <div className="app-shell">
      <header className="titlebar">
        <span className="titlebar__title">AI Terminal Manager</span>
      </header>
      <div className="app-body">
        <Sidebar />
        <main className="workspace-root">
          <LayoutRoot />
        </main>
      </div>
      <Toast />
    </div>
  )
}
