# AI Terminal Manager

A macOS desktop app for managing development terminals — specialized for the
**Claude Code CLI**. Run many sessions side by side and see, at a glance, which one
is working, which is waiting for you, what each is costing, and what's changed on
disk.

Built with **Electron + React + TypeScript + xterm.js + node-pty**.

---

## Features

- **See every session at a glance** — a live sidebar lists *all* Claude Code sessions
  on your machine (read from `~/.claude`, including desktop-app sessions — no CLI
  required), each with a color-coded status (working / awaiting-input / idle / ended),
  AI-generated title, cwd + git branch, token/cost estimate, and task progress.
- **Optimized layout** — dockview-based split / tab / grid layout with drag-to-dock;
  layout persists across restarts.
- **Pin terminals** — pinned tabs can't be closed by `Cmd+W` (force-close with
  `Cmd+Shift+W`); pin from the tab, a right-click menu, or `Cmd+Shift+P`.
- **Inline diff viewer** — view a session's working-tree diff (diff2html, theme-aware)
  in a panel, or **Open in VS Code** for deep review.
- **Custom tab groups** — create / rename / recolor / delete color-coded, collapsible
  groups; drag sessions between them.
- **Deep Claude awareness** — per-session live status, token/cost rollup, and task
  progress, driven by a status machine over the transcript stream.
- **Tab ↔ session correlation** — an app-spawned `claude` terminal shows its live
  session status on its tab; observed session rows click-to-focus the tab, or
  **resume** an external/old session in a new tab.
- **macOS menu-bar tray** — status-aware title, a session list (click to focus), and
  quick New Claude / New Terminal actions.
- **Native notifications** — when a session finishes a turn and needs your input.
- **Theming** — Midnight / Graphite / Nord / Daylight presets, accent color, terminal
  font size.
- **Auto-update** — `electron-updater` (see [Packaging](#packaging--auto-update)).

---

## Getting started

Requires Node 20+ and macOS.

```bash
npm install        # postinstall fixes node-pty's spawn-helper exec bit on macOS
npm run dev        # launch the app with hot reload
```

Other scripts:

```bash
npm run typecheck      # tsc for main/preload + renderer
npm test               # Vitest (status machine, line parser)
npm run build          # production build into out/
npm run icon           # regenerate app icon (png + icns) from build/icon.svg
npm run package        # build an unsigned .app into release/ (no signing attempt)
npm run install:local  # build + copy the app to /Applications (personal use)
npm run dist           # build distributable dmg + zip (for signed releases)
```

### Personal use (no Apple Developer account)

Signing is only needed to distribute to *other* people's Macs cleanly and to use
auto-update. For your own machine, just:

```bash
npm run install:local   # installs to /Applications/AI Terminal Manager.app
```

A locally built app has no Gatekeeper quarantine, so it opens normally. To update,
re-run it after pulling changes:

```bash
git pull && npm install && npm run install:local
```

(Auto-update stays dormant in unsigned builds — updating just means rebuilding.)

---

## Using it

- **New Claude** (`Cmd+Shift+T`) opens a terminal and runs
  `claude --dangerously-skip-permissions`. This needs the `claude` CLI on your
  interactive shell's PATH — if it isn't found, a toast points you to **Settings**,
  where the launch command is editable. (Session *awareness* works regardless, since
  it reads `~/.claude` directly.)
- **New Terminal** (`Cmd+T`) opens a plain shell.

### Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Cmd+T` / `Cmd+Shift+T` | New terminal / New Claude session |
| `Cmd+W` / `Cmd+Shift+W` | Close tab (blocked if pinned) / Force close |
| `Cmd+Shift+P` | Pin / unpin the active tab |
| `Cmd+1`…`Cmd+9` | Jump to tab N |
| `Cmd+Shift+]` / `Cmd+Shift+[` | Next / previous tab |
| `Cmd+,` / `Cmd+/` | Settings / Keyboard shortcuts |

---

## Architecture

- **Main process** (`src/main`) — app lifecycle, window, native menu, control-plane
  IPC, the macOS tray (`tray.ts`), auto-update (`updater.ts`), git diff (`services/git.ts`),
  and the Claude awareness service (`services/claude/`).
- **PTY host** (`src/main/pty-host.ts`) — a crash-isolated `utilityProcess` that owns
  all `node-pty` instances, batches output, and streams it to the renderer over a
  per-terminal `MessagePort` (the main process stays out of the data path).
- **Renderer** (`src/renderer`) — React + dockview + xterm. A non-React
  `TerminalManager` singleton owns xterm instances for the lifetime of the *session*
  (not the React component), so dockview re-parenting/splits never tear down a live
  terminal.
- **Claude awareness** (`src/main/services/claude`) — discovers sessions from the
  transcript tree reconciled with the `~/.claude/sessions` registry + pid liveness;
  an incremental byte-offset JSONL tailer feeds a pure, table-driven status machine,
  token/cost rollup, and task summary; a debounced snapshot is pushed to the renderer.
- **Shared types** (`src/shared`) — IPC contracts shared by main, preload, and renderer.

State lives in Zustand stores (`src/renderer/src/state`); the dockview layout is
persisted alongside session metadata.

> **Note:** the per-session cost is an *estimate* (priced from token counts at editable
> rates in Settings) — it does not reflect subscription billing. Switch the metric to
> Tokens or Off in Settings if you prefer.

---

## Packaging & auto-update

`npm run dist` produces a macOS dmg + zip via `electron-builder` (config in
`electron-builder.yml`). `node-pty` is unpacked from the asar so its native addon and
`spawn-helper` run correctly.

**Auto-update** uses `electron-updater` against a GitHub Releases feed. To enable it:

1. Set `publish.owner` / `publish.repo` in `electron-builder.yml`.
2. Code-sign **and notarize** the build with a Developer ID — macOS (Squirrel.Mac)
   will not apply updates to an unsigned app. Provide the signing identity via
   `CSC_LINK` / `CSC_KEY_PASSWORD` and configure notarization.
3. Publish releases (`electron-builder` with `--publish`).

Until then, the app runs fine; auto-update is a no-op in dev and unsigned builds.

---

## Status

Built in phases (see commit history): terminals + layout → Claude awareness → diff
viewer → correlation → notifications/tray → resume → packaging. The status machine and
JSONL parser are covered by Vitest. An app icon is not yet included (electron-builder
uses the default).
