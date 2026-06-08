import { createRoot } from 'react-dom/client'
import { App } from './App'
import { applyTheme } from './theme/applyTheme'
import { useStore } from './state/store'
import '@xterm/xterm/css/xterm.css'
import './styles/global.css'

// In Electron the preload always provides window.atm. This no-op fallback only
// installs when the renderer is loaded outside Electron (e.g. the Vite dev URL in
// a browser), so the app chrome still renders instead of hard-crashing.
if (!('atm' in window)) {
  ;(window as unknown as { atm: Window['atm'] }).atm = {
    spawnTerminal: async () => ({ terminalId: '', pid: -1 }),
    killTerminal: async () => undefined,
    openExternal: async () => undefined,
    resolveCommand: async () => null,
    onMenuAction: () => undefined,
    claude: { getSnapshot: async () => [], onSnapshot: () => () => undefined },
    git: {
      diff: async () => ({ isRepo: false, diff: '', changedFiles: 0, untracked: [] }),
      openInVSCode: async () => ({ ok: false }),
    },
  }
}

// Apply persisted appearance before first paint to avoid a flash.
{
  const s = useStore.getState()
  applyTheme(s.themeId, s.accent, s.terminalFontSize)
}

const root = document.getElementById('root')
if (!root) throw new Error('#root not found')

// StrictMode is intentionally OFF: it double-invokes effects, which would
// double-mount xterm during early development. The TerminalManager singleton is
// designed to tolerate it, but keeping it off reduces noise while iterating.
createRoot(root).render(<App />)
