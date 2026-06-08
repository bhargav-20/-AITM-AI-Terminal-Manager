import { app, Notification, type BrowserWindow } from 'electron'
import electronUpdater from 'electron-updater'

const { autoUpdater } = electronUpdater

export interface CheckResult {
  status: 'disabled' | 'no-update' | 'available' | 'error'
  version?: string
  message?: string
}

const SIX_HOURS = 6 * 60 * 60 * 1000
let initialized = false
let getWindow: () => BrowserWindow | null = () => null

/** Background auto-update — only active in a packaged build with a real feed. */
export function initAutoUpdate(getWin: () => BrowserWindow | null): void {
  getWindow = getWin
  if (!app.isPackaged || initialized) return
  initialized = true

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-downloaded', (info) => {
    if (Notification.isSupported()) {
      const n = new Notification({
        title: 'Update ready',
        body: `Version ${info.version} will install when you restart.`,
      })
      n.on('click', () => autoUpdater.quitAndInstall())
      n.show()
    }
    getWindow()?.webContents.send('app:updateReady', info.version)
  })

  autoUpdater.checkForUpdates().catch(() => undefined)
  setInterval(() => autoUpdater.checkForUpdates().catch(() => undefined), SIX_HOURS)
}

export async function checkForUpdatesManual(): Promise<CheckResult> {
  if (!app.isPackaged) {
    return { status: 'disabled', message: 'Updates only run in a packaged build.' }
  }
  try {
    const result = await autoUpdater.checkForUpdates()
    const version = result?.updateInfo?.version
    if (version && version !== app.getVersion()) return { status: 'available', version }
    return { status: 'no-update', version: app.getVersion() }
  } catch (e) {
    return { status: 'error', message: String(e) }
  }
}

export function quitAndInstall(): void {
  autoUpdater.quitAndInstall()
}
