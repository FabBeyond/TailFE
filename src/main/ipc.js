import { execFile } from "node:child_process"
import fs from "node:fs/promises"
import { promisify } from "node:util"
import { basename, join } from "node:path"
import { app, ipcMain, shell } from "electron"

const FILE_MANAGER_DESKTOP_IDS = [
  "org.gnome.nautilus.desktop",
  "nautilus.desktop",
  "org.gnome.Nautilus.desktop",
  "dolphin.desktop",
  "org.kde.dolphin.desktop",
  "nemo.desktop",
  "pcmanfm.desktop",
  "pcmanfm-qt.desktop",
  "thunar.desktop",
  "io.elementary.files.desktop"
]

const execFileAsync = promisify(execFile)
const ALLOWED_PATHS = ["home", "desktop", "documents", "downloads", "music", "pictures", "videos"]

async function hasDefaultProgram(path) {
  try {
    const { stdout: mimeType } = await execFileAsync("xdg-mime", ["query", "filetype", path])
    const { stdout: defaultApp } = await execFileAsync("xdg-mime", [
      "query",
      "default",
      mimeType.trim()
    ])
    const app = defaultApp.trim()
    if (!app) return false
    return !FILE_MANAGER_DESKTOP_IDS.includes(app)
  } catch {
    return false
  }
}
export function registerIpcHandlers() {
  ipcMain.handle("read-dir", async (_event, dirPath) => {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      const detailed = await Promise.all(
        entries.map(async (e) => {
          try {
            const stats = await fs.stat(join(dirPath, e.name))
            return {
              name: e.name,
              isDirectory: stats.isDirectory(),
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
        })
      )
      return detailed
    } catch (err) {
      return { error: err.code }
    }
  })

  ipcMain.handle("delete-file", async (_event, filePath) => {
    try {
      await shell.trashItem(filePath, { recursive: true })
      return { success: true }
    } catch (err) {
      return { error: err.code }
    }
  })
  ipcMain.handle("create-folder", async (_event, dir) => {
    for (let i = 1; ; i++) {
      const name = i === 1 ? "New Folder" : `New Folder (${i})`
      const path = join(dir, name)
      try {
        await fs.mkdir(path)
        return { path }
      } catch (err) {
        if (err.code !== "EEXIST") return { error: err.code }
      }
    }
  })
  ipcMain.handle("rename", async (_event, path, newPath) => {
    try {
      await fs.access(newPath)
      return { error: "EEXIST" }
    } catch {
      // target doesn't exist yet, which is what we want
    }

    try {
      await fs.rename(path, newPath)
      return { success: true }
    } catch (err) {
      return { error: err.code ?? err.message }
    }
  })
  ipcMain.handle("open-file", async (_event, path) => {
    if (!(await hasDefaultProgram(path))) {
      return { noProgram: true }
    }
    const result = await shell.openPath(path)
    return result ? { error: result } : { success: true }
  })
  ipcMain.handle("get-path", (_, name) => {
    if (!ALLOWED_PATHS.includes(name)) return { error: "EINVAL" }
    try {
      return { path: app.getPath(name) }
    } catch (err) {
      return { error: err.message }
    }
  })
  ipcMain.handle("move", async (_, oldPath, destDir, copy = false) => {
    const newPath = join(destDir, basename(oldPath))
    try {
      await fs.access(newPath)
      return { error: "EEXIST" }
    } catch {
      // target doesn't exist yet, which is what we want
    }

    try {
      await fs.cp(oldPath, newPath, { recursive: true })
      if (!copy) await fs.rm(oldPath, { recursive: true })

      return { success: true }
    } catch (err) {
      return { error: err.message }
    }
  })
}
