import { useCallback, useEffect, useMemo, useState } from 'react'
import type { IDockviewPanelProps } from 'dockview'
import { html as renderDiff } from 'diff2html'
import { ColorSchemeType } from 'diff2html/lib/types'
import 'diff2html/bundles/css/diff2html.min.css'
import { useStore } from '../state/store'
import { getTheme } from '../theme/applyTheme'
import { toast } from '../ui/toastBus'
import type { GitDiffResult } from '@shared/git'

type Params = { cwd: string; label?: string }

function basename(p: string): string {
  if (!p) return '~'
  const parts = p.replace(/\/+$/, '').split('/')
  return parts[parts.length - 1] || p
}

export function DiffPanel(props: IDockviewPanelProps<Params>): React.JSX.Element {
  const { cwd, label } = props.params
  const themeId = useStore((s) => s.themeId)
  const mode = getTheme(themeId).mode
  const [result, setResult] = useState<GitDiffResult | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setResult(await window.atm.git.diff(cwd))
    } finally {
      setLoading(false)
    }
  }, [cwd])

  useEffect(() => {
    void load()
  }, [load])

  const rendered = useMemo(() => {
    if (!result?.diff) return ''
    return renderDiff(result.diff, {
      drawFileList: true,
      matching: 'lines',
      outputFormat: 'side-by-side',
      colorScheme: mode === 'light' ? ColorSchemeType.LIGHT : ColorSchemeType.DARK,
    })
  }, [result, mode])

  const openVSCode = async (): Promise<void> => {
    const r = await window.atm.git.openInVSCode(cwd)
    if (!r.ok && r.error) toast(r.error)
  }

  return (
    <div className="diffpanel">
      <div className="diffpanel__toolbar">
        <span className="diffpanel__title">{label || basename(cwd)}</span>
        {result?.isRepo && (
          <span className="diffpanel__count">{result.changedFiles} changed</span>
        )}
        <span className="diffpanel__spacer" />
        <button className="diffpanel__btn" onClick={() => void load()}>
          Refresh
        </button>
        <button className="diffpanel__btn diffpanel__btn--accent" onClick={() => void openVSCode()}>
          Open in VS Code
        </button>
      </div>
      <div className="diffpanel__body">
        {loading ? (
          <div className="diffpanel__msg">Loading diff…</div>
        ) : !result?.isRepo ? (
          <div className="diffpanel__msg">
            Not a git repository:
            <br />
            <code>{cwd || '~'}</code>
          </div>
        ) : !result.diff && result.untracked.length === 0 ? (
          <div className="diffpanel__msg">No changes vs HEAD ✓</div>
        ) : (
          <>
            {result.untracked.length > 0 && (
              <div className="diffpanel__note">
                {result.untracked.length} untracked file{result.untracked.length > 1 ? 's' : ''} not
                shown — open in VS Code to view.
              </div>
            )}
            {result.diff ? (
              <div className="diffpanel__diff" dangerouslySetInnerHTML={{ __html: rendered }} />
            ) : (
              <div className="diffpanel__msg">Only untracked changes.</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
