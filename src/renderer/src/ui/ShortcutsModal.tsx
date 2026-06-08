import { useStore } from '../state/store'
import { Modal } from './Modal'

const SHORTCUTS: Array<[string, string]> = [
  ['⌘T', 'New terminal'],
  ['⇧⌘T', 'New Claude session'],
  ['⌘W', 'Close tab (blocked when pinned)'],
  ['⇧⌘W', 'Force close tab'],
  ['⇧⌘P', 'Pin / unpin active tab'],
  ['⌘1 – ⌘9', 'Jump to tab'],
  ['⇧⌘]  /  ⇧⌘[', 'Next / previous tab'],
  ['⌘,', 'Settings'],
  ['⌘/', 'This help'],
]

export function ShortcutsModal(): React.JSX.Element {
  const open = useStore((s) => s.shortcutsOpen)
  const setOpen = useStore((s) => s.setShortcutsOpen)

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Keyboard Shortcuts" width={420}>
      <div className="shortcuts">
        {SHORTCUTS.map(([keys, desc]) => (
          <div className="shortcuts__row" key={desc}>
            <span className="shortcuts__desc">{desc}</span>
            <kbd className="shortcuts__keys">{keys}</kbd>
          </div>
        ))}
      </div>
    </Modal>
  )
}
