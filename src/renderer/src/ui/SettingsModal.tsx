import { useStore } from '../state/store'
import { THEMES, ACCENTS } from '../theme/themes'
import { Modal } from './Modal'

export function SettingsModal(): React.JSX.Element {
  const open = useStore((s) => s.settingsOpen)
  const setOpen = useStore((s) => s.setSettingsOpen)
  const themeId = useStore((s) => s.themeId)
  const setThemeId = useStore((s) => s.setThemeId)
  const accent = useStore((s) => s.accent)
  const setAccent = useStore((s) => s.setAccent)
  const fontSize = useStore((s) => s.terminalFontSize)
  const setFontSize = useStore((s) => s.setTerminalFontSize)
  const claudeCommand = useStore((s) => s.claudeCommand)
  const setClaudeCommand = useStore((s) => s.setClaudeCommand)
  const sessionMetric = useStore((s) => s.sessionMetric)
  const setSessionMetric = useStore((s) => s.setSessionMetric)
  const rates = useStore((s) => s.rates)
  const setRate = useStore((s) => s.setRate)
  const resetRates = useStore((s) => s.resetRates)

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Settings">
      <section className="settings__section">
        <h4 className="settings__label">Theme</h4>
        <div className="theme-grid">
          {THEMES.map((t) => (
            <button
              key={t.id}
              className={`theme-card${themeId === t.id ? ' is-selected' : ''}`}
              onClick={() => setThemeId(t.id)}
            >
              <div className="theme-card__preview" style={{ background: t.tokens.bg }}>
                <span className="theme-card__bar" style={{ background: t.tokens['bg-elev'] }} />
                <span className="theme-card__dot" style={{ background: accent }} />
                <span className="theme-card__line" style={{ background: t.terminal.foreground }} />
                <span
                  className="theme-card__line theme-card__line--short"
                  style={{ background: t.tokens['text-dim'] }}
                />
              </div>
              <span className="theme-card__name">{t.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="settings__section">
        <h4 className="settings__label">Accent</h4>
        <div className="accent-row">
          {ACCENTS.map((a) => (
            <button
              key={a.id}
              title={a.name}
              className={`accent-dot${accent === a.value ? ' is-selected' : ''}`}
              style={{ background: a.value }}
              onClick={() => setAccent(a.value)}
            />
          ))}
        </div>
      </section>

      <section className="settings__section">
        <h4 className="settings__label">Terminal font size</h4>
        <div className="stepper">
          <button onClick={() => setFontSize(fontSize - 1)} aria-label="Decrease">
            −
          </button>
          <span className="stepper__value">{fontSize}px</span>
          <button onClick={() => setFontSize(fontSize + 1)} aria-label="Increase">
            +
          </button>
        </div>
      </section>

      <section className="settings__section">
        <h4 className="settings__label">Session metric</h4>
        <div className="segmented">
          {(['cost', 'tokens', 'off'] as const).map((m) => (
            <button
              key={m}
              className={`segmented__btn${sessionMetric === m ? ' is-active' : ''}`}
              onClick={() => setSessionMetric(m)}
            >
              {m === 'cost' ? 'Cost' : m === 'tokens' ? 'Tokens' : 'Off'}
            </button>
          ))}
        </div>
        {sessionMetric === 'cost' && (
          <div className="rates">
            <div className="rates__row rates__row--head">
              <span className="rates__model">$ / 1M</span>
              <span>Input</span>
              <span>Output</span>
              <span>Cache wr</span>
              <span>Cache rd</span>
            </div>
            {(['opus', 'sonnet', 'haiku'] as const).map((model) => (
              <div className="rates__row" key={model}>
                <span className="rates__model">{model[0].toUpperCase() + model.slice(1)}</span>
                {(['input', 'output', 'cacheWrite', 'cacheRead'] as const).map((f) => (
                  <input
                    key={f}
                    type="number"
                    min="0"
                    step="0.01"
                    className="rates__input"
                    value={rates[model][f]}
                    onChange={(e) => setRate(model, f, parseFloat(e.target.value))}
                  />
                ))}
              </div>
            ))}
            <button className="rates__reset" onClick={resetRates}>
              Reset to defaults
            </button>
            <p className="settings__hint">
              Estimate only — long sessions are dominated by cache-read tokens, and
              subscription plans aren’t billed per token.
            </p>
          </div>
        )}
      </section>

      <section className="settings__section">
        <h4 className="settings__label">Claude command</h4>
        <input
          className="settings__input"
          value={claudeCommand}
          spellCheck={false}
          onChange={(e) => setClaudeCommand(e.target.value)}
          placeholder="claude --dangerously-skip-permissions"
        />
        <p className="settings__hint">
          Run when you click “New Claude”. Use a full path if the CLI isn’t on your PATH.
        </p>
      </section>
    </Modal>
  )
}
