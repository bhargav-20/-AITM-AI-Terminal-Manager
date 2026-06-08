import type { ITheme } from '@xterm/xterm'
import { DEFAULT_XTERM_THEME } from '../terminal/xtermConfig'

export interface Theme {
  id: string
  name: string
  mode: 'dark' | 'light'
  /** CSS custom-property values (without the leading `--`). */
  tokens: Record<string, string>
  terminal: ITheme
}

export interface AccentOption {
  id: string
  name: string
  value: string
}

export const ACCENTS: AccentOption[] = [
  { id: 'blue', name: 'Blue', value: '#6ea8fe' },
  { id: 'violet', name: 'Violet', value: '#b48ef0' },
  { id: 'green', name: 'Green', value: '#5fd38a' },
  { id: 'amber', name: 'Amber', value: '#e2b66d' },
  { id: 'rose', name: 'Rose', value: '#f08a9b' },
  { id: 'cyan', name: 'Cyan', value: '#5fc9d6' },
  { id: 'red', name: 'Red', value: '#ff6b6b' },
  { id: 'slate', name: 'Slate', value: '#8a90a0' },
]

export const THEMES: Theme[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    mode: 'dark',
    tokens: {
      bg: '#0d0e12',
      'bg-elev': '#14161d',
      'bg-elev-2': '#1b1e27',
      'bg-hover': '#20242f',
      border: '#262a35',
      'border-soft': '#1e222b',
      text: '#d6d9e0',
      'text-dim': '#8a90a0',
      'text-faint': '#5a6172',
    },
    terminal: DEFAULT_XTERM_THEME,
  },
  {
    id: 'graphite',
    name: 'Graphite',
    mode: 'dark',
    tokens: {
      bg: '#131314',
      'bg-elev': '#1a1a1c',
      'bg-elev-2': '#232327',
      'bg-hover': '#2b2b30',
      border: '#34343a',
      'border-soft': '#262629',
      text: '#e6e6e9',
      'text-dim': '#9b9ba3',
      'text-faint': '#62626b',
    },
    terminal: {
      background: '#131314',
      foreground: '#e6e6e9',
      cursor: '#e6e6e9',
      cursorAccent: '#131314',
      selectionBackground: '#3a3a42',
      black: '#2a2a2e',
      red: '#f0726a',
      green: '#9ece6a',
      yellow: '#e0af68',
      blue: '#7aa2f7',
      magenta: '#bb9af7',
      cyan: '#7dcfff',
      white: '#cfcfd6',
      brightBlack: '#62626b',
      brightRed: '#ff8b85',
      brightGreen: '#b9f08c',
      brightYellow: '#f0c98a',
      brightBlue: '#9ab8ff',
      brightMagenta: '#d2b4ff',
      brightCyan: '#a0e3ff',
      brightWhite: '#ffffff',
    },
  },
  {
    id: 'nord',
    name: 'Nord',
    mode: 'dark',
    tokens: {
      bg: '#2e3440',
      'bg-elev': '#333b4a',
      'bg-elev-2': '#3b4252',
      'bg-hover': '#434c5e',
      border: '#434c5e',
      'border-soft': '#3b4252',
      text: '#e5e9f0',
      'text-dim': '#aebacf',
      'text-faint': '#7b88a1',
    },
    terminal: {
      background: '#2e3440',
      foreground: '#d8dee9',
      cursor: '#88c0d0',
      cursorAccent: '#2e3440',
      selectionBackground: '#434c5e',
      black: '#3b4252',
      red: '#bf616a',
      green: '#a3be8c',
      yellow: '#ebcb8b',
      blue: '#81a1c1',
      magenta: '#b48ead',
      cyan: '#88c0d0',
      white: '#e5e9f0',
      brightBlack: '#4c566a',
      brightRed: '#bf616a',
      brightGreen: '#a3be8c',
      brightYellow: '#ebcb8b',
      brightBlue: '#81a1c1',
      brightMagenta: '#b48ead',
      brightCyan: '#8fbcbb',
      brightWhite: '#eceff4',
    },
  },
  {
    id: 'daylight',
    name: 'Daylight',
    mode: 'light',
    tokens: {
      bg: '#ffffff',
      'bg-elev': '#f4f5f7',
      'bg-elev-2': '#eceef1',
      'bg-hover': '#e3e6ea',
      border: '#d7dbe1',
      'border-soft': '#e8eaee',
      text: '#1b1f24',
      'text-dim': '#5a6573',
      'text-faint': '#97a0ad',
    },
    terminal: {
      background: '#ffffff',
      foreground: '#1b1f24',
      cursor: '#2f6fd6',
      cursorAccent: '#ffffff',
      selectionBackground: '#cfe0ff',
      black: '#1b1f24',
      red: '#d1383d',
      green: '#2f8a3a',
      yellow: '#9a6700',
      blue: '#2f6fd6',
      magenta: '#8a45c7',
      cyan: '#1f8aa0',
      white: '#6e7781',
      brightBlack: '#97a0ad',
      brightRed: '#e0484d',
      brightGreen: '#36a345',
      brightYellow: '#b97e00',
      brightBlue: '#3f82ea',
      brightMagenta: '#9d57db',
      brightCyan: '#2aa0b8',
      brightWhite: '#1b1f24',
    },
  },
]
