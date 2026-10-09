import { join } from 'node:path'
import { execFile, spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import { promisify } from 'node:util'
import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

const FILE_MANAGER_DESKTOP_IDS = [
  "org.gnome.nautilus.desktop", "nautilus.desktop", "org.gnome.Nautilus.desktop",
  "dolphin.desktop", "org.kde.dolphin.desktop",
  "nemo.desktop", "pcmanfm.desktop", "pcmanfm-qt.desktop",
  "thunar.desktop", "io.elementary.files.desktop"
]

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('read-dir', async (_event, dirPath) => {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      const detailed = await Promise.all(entries.map(async (e) => {
        try {
          const stats = await fs.stat(join(dirPath, e.name))
          return {
            name: e.name,
            isDirectory: e.isDirectory(),
            size: stats.size,
            lastModified: stats.mtime
          }
        } catch {
          return {
            name: e.name,
            isDirectory: e.isDirectory(),
            size: null,
            lastModified: null
          }
        }
      }))
      return detailed

    } catch (err) {
      return {error: err.code}
    }
  })

  const execFileAsync = promisify(execFile)
  async function hasDefaultProgram(path) {
    try {
      const {stdout: mimeType} = await execFileAsync("xdg-mime", ["query", "filetype", path])
      const {stdout: defaultApp} = await execFileAsync("xdg-mime", ["query", "default", mimeType.trim()])
      const app = defaultApp.trim()
      if (!app) return false
      return !FILE_MANAGER_DESKTOP_IDS.includes(app)
    }
    catch {
      return false
    }
  }

  ipcMain.handle("delete-file", async (_event, filePath) => {
    try {
      await fs.rm(filePath, {recursive: true})
    }
    catch (err) {
      return {error: err.code}
    }
  })
  ipcMain.handle("create-folder", async (_event, dirPath) => {
    try {
      await fs.mkdir(dirPath)
    }
    catch (err) {
      return {error: err.code}
    }
  })
  ipcMain.handle("rename", async (_event, path, newPath) => {
    try {
      await fs.rename(path, newPath)
    }
    catch (err) {
      return {error: err.code}
    }
  })
  ipcMain.handle("open-file", async (_event, path) => {
    if (!(await hasDefaultProgram(path))) {
      return {noProgram: true}
    }
    const result = await shell.openPath(path)
    return result ? {error: result} : {success: true}
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
