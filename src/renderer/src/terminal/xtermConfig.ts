import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { Unicode11Addon } from '@xterm/addon-unicode11'

// Dark theme tuned to the app shell. Colors chosen for legibility of Claude output.
export const TERMINAL_THEME = {
  background: '#0d0e12',
  foreground: '#d6d9e0',
  cursor: '#6ea8fe',
  cursorAccent: '#0d0e12',
  selectionBackground: '#2a3656',
  black: '#1c1f26',
  red: '#ff6b6b',
  green: '#6bd968',
  yellow: '#e2c08d',
  blue: '#6ea8fe',
  magenta: '#c792ea',
  cyan: '#6bd9d0',
  white: '#d6d9e0',
  brightBlack: '#5a6172',
  brightRed: '#ff8585',
  brightGreen: '#85e882',
  brightYellow: '#f0d29c',
  brightBlue: '#8fc0ff',
  brightMagenta: '#d6adf0',
  brightCyan: '#85e8df',
  brightWhite: '#ffffff',
} as const

export const SCROLLBACK = 8000

export interface XtermBundle {
  term: Terminal
  fit: FitAddon
}

export function createTerminal(): XtermBundle {
  const term = new Terminal({
    fontFamily: '"SF Mono", Menlo, Monaco, "Cascadia Code", monospace',
    fontSize: 13,
    lineHeight: 1.25,
    letterSpacing: 0,
    cursorBlink: true,
    cursorStyle: 'bar',
    scrollback: SCROLLBACK,
    allowProposedApi: true, // required by unicode11 / serialize addons
    macOptionIsMeta: true,
    theme: TERMINAL_THEME,
  })

  const fit = new FitAddon()
  term.loadAddon(fit)
  term.loadAddon(new WebLinksAddon()) // default handler -> window.open -> openExternal

  const unicode = new Unicode11Addon()
  term.loadAddon(unicode)
  term.unicode.activeVersion = '11'

  return { term, fit }
}
