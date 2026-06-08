import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { registerContextMenu, type MenuItem } from './contextMenuBus'

interface MenuState {
  x: number
  y: number
  items: MenuItem[]
}

export function ContextMenu(): React.JSX.Element | null {
  const [state, setState] = useState<MenuState | null>(null)
  const [openSub, setOpenSub] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    registerContextMenu((x, y, items) => {
      setState({ x, y, items })
      setOpenSub(null)
    })
    return () => registerContextMenu(null)
  }, [])

  useEffect(() => {
    if (!state) return
    const close = (): void => setState(null)
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') close()
    }
    const onDown = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('mousedown', onDown, true)
    window.addEventListener('blur', close)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('mousedown', onDown, true)
      window.removeEventListener('blur', close)
    }
  }, [state])

  // Keep the menu inside the viewport.
  useLayoutEffect(() => {
    if (!state || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const nx = r.right > window.innerWidth ? Math.max(4, window.innerWidth - r.width - 4) : state.x
    const ny = r.bottom > window.innerHeight ? Math.max(4, window.innerHeight - r.height - 4) : state.y
    ref.current.style.left = `${nx}px`
    ref.current.style.top = `${ny}px`
  }, [state])

  if (!state) return null

  const run = (item: MenuItem): void => {
    if (item.disabled || item.submenu) return
    setState(null)
    item.onClick?.()
  }

  const renderItem = (item: MenuItem, i: number, sub = false): React.JSX.Element => {
    if (item.separator) return <div key={i} className="ctxmenu__sep" />
    return (
      <div
        key={i}
        className={`ctxmenu__item${item.disabled ? ' is-disabled' : ''}${item.danger ? ' is-danger' : ''}`}
        onMouseEnter={() => !sub && setOpenSub(item.submenu ? i : null)}
        onClick={(e) => {
          e.stopPropagation()
          run(item)
        }}
      >
        {item.colorSwatch && (
          <span className="ctxmenu__swatch" style={{ background: item.colorSwatch }} />
        )}
        <span className="ctxmenu__label">{item.label}</span>
        {item.checked && <span className="ctxmenu__check">✓</span>}
        {item.submenu && <span className="ctxmenu__arrow">›</span>}
        {item.submenu && openSub === i && (
          <div className="ctxmenu ctxmenu--sub">
            {item.submenu.map((s, j) => renderItem(s, j, true))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className="ctxmenu"
      style={{ left: state.x, top: state.y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {state.items.map((item, i) => renderItem(item, i))}
    </div>
  )
}
