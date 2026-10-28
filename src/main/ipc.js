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
const ALLOWED_PATHS = ["home", "desktop", "documents", "downloads", "music", "pictures", "videos"]

const execFileAsync = promisify(execFile)

async function hasDefaultProgram(path) {
  try {
    const { stdout: mimeType } = await execFileAsync("xdg-mime", ["query", "filetype", path])
    const { stdout: defaultApp } = await execFileAsync("xdg-mime", [
      "query",
      "default",
      mimeType.trim()
    ])
    const appDefault = defaultApp.trim()
    if (!appDefault) return false
    return !FILE_MANAGER_DESKTOP_IDS.includes(appDefault)
  } catch {
    return false
  }
}

async function exists(path) {
  return fs.access(path).then(
    () => true,
    () => false
  )
}

// Thrown errors become { error: code }, so the renderer can map them with errorMessage()
function handle(channel, fn) {
  ipcMain.handle(channel, async (_event, ...args) => {
    try {
      return (await fn(...args)) ?? { success: true }
    } catch (err) {
      return { error: err.code ?? err.message }
    }
  })
}

export function registerIpcHandlers() {
  handle("read-dir", async (dirPath) => {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    return Promise.all(
      entries.map(async (e) => {
        const stats = await fs.stat(join(dirPath, e.name)).catch(() => null)
        return {
          name: e.name,
          isDirectory: stats?.isDirectory() ?? e.isDirectory(),
          size: stats?.size ?? null,
          lastModified: stats?.mtime ?? null
        }
      })
    )
  })
  handle("delete-file", (filePath) => shell.trashItem(filePath))
  handle("create-folder", async (dir) => {
    for (let i = 1; ; i++) {
      const name = i === 1 ? "New Folder" : `New Folder (${i})`
      const path = join(dir, name)
      try {
        await fs.mkdir(path)
        return { path }
      } catch (err) {
        if (err.code !== "EEXIST") throw err
      }
    }
  })
  handle("rename", async (path, newPath) => {
    if (await exists(newPath)) return { error: "EEXIST" }
    await fs.rename(path, newPath)
  })
  handle("open-file", async (path) => {
    if (!(await hasDefaultProgram(path))) return { noProgram: true }
    // openPath resolves with an error string instead of throwing
    const result = await shell.openPath(path)
    if (result) return { error: result }
  })
  handle("get-path", (name) => {
    if (!ALLOWED_PATHS.includes(name)) return { error: "EINVAL" }
    return { path: app.getPath(name) }
  })
  handle("move", async (oldPath, destDir, copy = false) => {
    const newPath = join(destDir, basename(oldPath))
    if (await exists(newPath)) return { error: "EEXIST" }

    if (!copy) {
      try {
        return await fs.rename(oldPath, newPath)
      } catch (err) {
        if (err.code !== "EXDEV") throw err
      }
    }

    await fs.cp(oldPath, newPath, { recursive: true })
    if (!copy) await fs.rm(oldPath, { recursive: true })
  })
}
