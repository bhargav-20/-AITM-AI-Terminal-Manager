import { join } from 'path'
import { execFile } from 'node:child_process'
import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  shell,
  utilityProcess,
  MessageChannelMain,
  type MenuItemConstructorOptions,
  type UtilityProcess,
} from 'electron'
import { IPC, type SpawnTerminalRequest, type SpawnTerminalResult } from '../shared/ipc'
import { CLAUDE_IPC } from '../shared/claude'
import { claudeService } from './services/claude/service'
import { GIT_IPC } from '../shared/git'
import { getDiff, openInVSCode } from './services/git'
import { initTray, update as updateTray, setNotificationsEnabled } from './tray'
import { initAutoUpdate, checkForUpdatesManual } from './updater'

let mainWindow: BrowserWindow | null = null
let ptyHost: UtilityProcess | null = null

const pendingSpawns = new Map<string, (result: SpawnTerminalResult) => void>()

function startPtyHost(): void {
  ptyHost = utilityProcess.fork(join(__dirname, 'pty-host.js'), [], {
    serviceName: 'atm-pty-host',
    stdio: 'pipe',
  })
  ptyHost.stdout?.on('data', (d) => console.log('[pty-host]', d.toString().trimEnd()))
  ptyHost.stderr?.on('data', (d) => console.error('[pty-host]', d.toString().trimEnd()))
  ptyHost.on('message', (msg: { type: string; terminalId: string; pid?: number; error?: string }) => {
    if (msg.type === 'spawned') {
      pendingSpawns.get(msg.terminalId)?.({ terminalId: msg.terminalId, pid: msg.pid! })
      pendingSpawns.delete(msg.terminalId)
    } else if (msg.type === 'spawn-error') {
      console.error('[pty-host] spawn error', msg.error)
      pendingSpawns.get(msg.terminalId)?.({ terminalId: msg.terminalId, pid: -1 })
      pendingSpawns.delete(msg.terminalId)
    }
  })
  ptyHost.on('exit', (code) => {
    console.error('[pty-host] exited with code', code)
    ptyHost = null
  })
}

function sendMenu(action: string): void {
  mainWindow?.webContents.send(action)
}

function focusClaudeSession(sessionId: string): void {
  if (!mainWindow) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
  mainWindow.webContents.send('claude:focusSession', sessionId)
}

// Custom application menu. Critically, Cmd+W is remapped to a renderer action
// (close the active *tab*) instead of closing the window — the renderer decides
// whether the active terminal is pinned. Cmd+Shift+W force-closes.
function buildMenu(): void {
  const template: MenuItemConstructorOptions[] = [
    { role: 'appMenu' },
    {
      label: 'File',
      submenu: [
        {
          label: 'New Terminal',
          accelerator: 'CmdOrCtrl+T',
          click: () => sendMenu('menu:newTerminal'),
        },
        {
          label: 'New Claude Session',
          accelerator: 'CmdOrCtrl+Shift+T',
          click: () => sendMenu('menu:newClaude'),
        },
        { type: 'separator' },
        {
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: () => sendMenu('menu:closeActive'),
        },
        {
          label: 'Force Close Tab',
          accelerator: 'CmdOrCtrl+Shift+W',
          click: () => sendMenu('menu:forceCloseActive'),
        },
      ],
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 800,
    minHeight: 560,
    show: false,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0d0e12',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      // sandbox is left off for now so the preload port-relay works smoothly;
      // hardened to true during Phase 1 security pass.
      sandbox: false,
      nodeIntegration: false,
    },
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

ipcMain.handle(IPC.spawnTerminal, async (_e, req: SpawnTerminalRequest): Promise<SpawnTerminalResult> => {
  if (!ptyHost) startPtyHost()
  if (!mainWindow) throw new Error('No window to attach terminal port to')

  const { port1, port2 } = new MessageChannelMain()
  // port1 -> pty-host (data plane producer), port2 -> renderer (consumer)
  ptyHost!.postMessage({ type: 'spawn', req }, [port1])
  mainWindow.webContents.postMessage(IPC.terminalPort, { terminalId: req.terminalId }, [port2])

  return new Promise<SpawnTerminalResult>((resolve) => {
    pendingSpawns.set(req.terminalId, resolve)
  })
})

ipcMain.handle(IPC.killTerminal, async (_e, terminalId: string) => {
  ptyHost?.postMessage({ type: 'kill', terminalId })
})

ipcMain.handle('app:openExternal', async (_e, url: string) => {
  await shell.openExternal(url)
})

ipcMain.handle(CLAUDE_IPC.getSnapshot, () => claudeService.snapshot())

ipcMain.handle(GIT_IPC.diff, (_e, cwd: string) => getDiff(cwd))
ipcMain.handle(GIT_IPC.openInVSCode, (_e, cwd: string) => openInVSCode(cwd))

ipcMain.handle('app:setNotifications', (_e, enabled: boolean) => setNotificationsEnabled(enabled))
ipcMain.handle('app:checkForUpdates', () => checkForUpdatesManual())
ipcMain.handle('app:getVersion', () => app.getVersion())

// Resolve whether a command (e.g. "claude") is on the user's interactive-login
// PATH, so the UI can warn when New Claude would fail. Returns the resolved path
// or null. The token is restricted to a safe charset before being shell-evaluated.
ipcMain.handle('app:resolveCommand', async (_e, token: string): Promise<string | null> => {
  if (!token || !/^[\w./-]+$/.test(token)) return null
  const shellPath = process.env.SHELL || '/bin/zsh'
  return new Promise<string | null>((resolve) => {
    execFile(
      shellPath,
      ['-lic', `command -v ${token} 2>/dev/null`],
      { timeout: 5000 },
      (_err, stdout) => {
        const out = (stdout || '').trim()
        resolve(out || null)
      },
    )
  })
})

app.whenReady().then(() => {
  buildMenu()
  startPtyHost()
  createWindow()
  // In dev the dock shows the default Electron icon; packaged builds use the .icns.
  if (!app.isPackaged && process.platform === 'darwin') {
    try {
      app.dock?.setIcon(join(process.cwd(), 'build', 'icon.png'))
    } catch {
      /* ignore */
    }
  }
  if (mainWindow) claudeService.setWindow(mainWindow)
  initTray({ getWindow: () => mainWindow, sendMenu, focusSession: focusClaudeSession })
  claudeService.setOnUpdate(updateTray)
  initAutoUpdate(() => mainWindow)
  void claudeService.start()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
      if (mainWindow) claudeService.setWindow(mainWindow)
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
