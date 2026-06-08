import type { ITheme } from '@xterm/xterm'
import { THEMES, type Theme } from './themes'
import { TerminalManager } from '../terminal/TerminalManager'

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}

/** Append an 8-bit alpha byte (e.g. '28') to a #rrggbb color. */
function withAlpha(hex: string, alpha: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex + alpha : hex
}

/**
 * Single source of truth for appearance. Writes theme tokens + accent to
 * documentElement (the app chrome and the dockview `--dv-*` overrides both read
 * these), and pushes the terminal palette + font size to all xterm instances.
 */
export function applyTheme(themeId: string, accent: string, fontSize: number): void {
  const theme = getTheme(themeId)
  const root = document.documentElement

  for (const [key, value] of Object.entries(theme.tokens)) {
    root.style.setProperty(`--${key}`, value)
  }
  root.style.setProperty('--accent', accent)
  root.style.setProperty('--accent-soft', withAlpha(accent, '28'))
  root.style.setProperty('color-scheme', theme.mode)

  const xtermTheme: ITheme = {
    ...theme.terminal,
    cursor: accent,
    cursorAccent: theme.terminal.background,
    selectionBackground: withAlpha(accent, '44'),
  }
  TerminalManager.setTheme(xtermTheme, fontSize)
}
