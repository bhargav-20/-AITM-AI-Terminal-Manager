import { useEffect } from 'react'
import type { IDockviewPanelProps } from 'dockview'
import { TerminalView } from '../terminal/TerminalView'
import { TerminalManager } from '../terminal/TerminalManager'
import { useStore } from '../state/store'

type PanelParams = { terminalId: string }

export function TerminalPanel(props: IDockviewPanelProps<PanelParams>): React.JSX.Element {
  const id = props.params.terminalId
  const session = useStore((s) => s.sessions[id])
  const updateSession = useStore((s) => s.updateSession)

  useEffect(() => {
    updateSession(id, { status: 'running' })
    return TerminalManager.onExit(id, (code) =>
      updateSession(id, { status: 'exited', exitCode: code }),
    )
  }, [id, updateSession])

  if (!session) {
    return <div className="panel-empty">Session not found</div>
  }

  return (
    <div className="terminal-panel">
      <TerminalView
        terminalId={id}
        spawn={{
          cwd: session.cwd,
          shell: session.shell,
          args: session.args,
          autorun: session.autorun,
        }}
      />
    </div>
  )
}
