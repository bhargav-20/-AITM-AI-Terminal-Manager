import { useEffect } from 'react'
import { useStore } from '../state/store'
import { focusTabByIndex, focusAdjacentTab, togglePinActive } from '../commands/sessions'

// Returns true if focus is in one of OUR form fields (not xterm's hidden textarea,
// which we must let shortcuts work over while a terminal is focused).
function inAppFormField(): boolean {
  const el = document.activeElement as HTMLElement | null
  if (!el) return false
  if (el.tagName === 'INPUT') return true
  if (el.tagName === 'TEXTAREA') return !el.classList.contains('xterm-helper-textarea')
  return el.getAttribute('contenteditable') === 'true'
}

export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      if (inAppFormField()) return

      const store = useStore.getState()

      if (e.key === ',') {
        e.preventDefault()
        e.stopPropagation()
        store.setSettingsOpen(!store.settingsOpen)
        return
      }
      if (e.key === '/') {
        e.preventDefault()
        e.stopPropagation()
        store.setShortcutsOpen(!store.shortcutsOpen)
        return
      }
      if (/^[1-9]$/.test(e.key)) {
        e.preventDefault()
        e.stopPropagation()
        focusTabByIndex(parseInt(e.key, 10) - 1)
        return
      }
      if (e.shiftKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault()
        e.stopPropagation()
        togglePinActive()
        return
      }
      if (e.shiftKey && e.key === ']') {
        e.preventDefault()
        e.stopPropagation()
        focusAdjacentTab(1)
        return
      }
      if (e.shiftKey && e.key === '[') {
        e.preventDefault()
        e.stopPropagation()
        focusAdjacentTab(-1)
      }
    }
    // capture phase so it runs before xterm consumes the event
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [])
}
