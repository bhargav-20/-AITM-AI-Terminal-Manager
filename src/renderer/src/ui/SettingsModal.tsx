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
    </Modal>
  )
}
