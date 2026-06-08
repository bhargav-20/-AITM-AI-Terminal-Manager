import { createRoot } from 'react-dom/client'
import { App } from './App'
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
    onMenuAction: () => undefined,
  }
}

const root = document.getElementById('root')
if (!root) throw new Error('#root not found')

// StrictMode is intentionally OFF: it double-invokes effects, which would
// double-mount xterm during early development. The TerminalManager singleton is
// designed to tolerate it, but keeping it off reduces noise while iterating.
createRoot(root).render(<App />)
