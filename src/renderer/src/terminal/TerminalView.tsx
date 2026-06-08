import { useEffect, useRef } from 'react'
import { TerminalManager, type SpawnOptions } from './TerminalManager'

interface TerminalViewProps {
  terminalId: string
  spawn: SpawnOptions
}

/**
 * Thin attach surface for a terminal. The xterm instance lives in TerminalManager
 * and survives this component unmounting/remounting (e.g. dockview re-parenting).
 */
export function TerminalView({ terminalId, spawn }: TerminalViewProps): React.JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    TerminalManager.mount(terminalId, host)
    void TerminalManager.spawn(terminalId, spawn)

    const ro = new ResizeObserver(() => TerminalManager.fit(terminalId))
    ro.observe(host)

    return () => ro.disconnect()
    // terminalId identifies the terminal; spawn opts are only read on first spawn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terminalId])

  return (
    <div
      ref={hostRef}
      className="terminal-host"
      onMouseDown={() => TerminalManager.focus(terminalId)}
    />
  )
}
