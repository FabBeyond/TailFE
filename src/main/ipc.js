import { execFile } from "node:child_process"
import fs from "node:fs/promises"
import { promisify } from "node:util"
import { basename, join, dirname, resolve, sep, extname } from "node:path"
import { app, ipcMain, shell } from "electron"
import { openPromise } from "yauzl"
import { pipeline } from "node:stream/promises"
import { createWriteStream } from "node:fs"
import { ZipArchive } from "archiver"

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
const DRIVE_PATHS = ["/mnt/", "/media/", "/run/media/"]

const settingsPath = () => join(app.getPath("userData"), "settings.json")

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
function isValidDrive(drive) {
  if (!drive.source.startsWith("/dev/")) return false
  if (drive.target === "/") return true

  return DRIVE_PATHS.some((p) => drive.target.startsWith(p))
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

async function listDrives() {
  const letters = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"]
  const found = await Promise.all(letters.map(async (l) => ((await exists(`${l}:/`)) ? l : null)))
  return found
    .filter(Boolean)
    .map((l) => ({ name: `${l}:`, isDirectory: true, size: null, lastModified: null }))
}
function toPosix(path) {
  if (process.platform === "win32") return path.replaceAll("\\", "/")
  return path
}
function isDriveRoot(path) {
  return process.platform === "win32" && /^[A-Za-z]:[\\/]?$/.test(path)
}

export function registerIpcHandlers() {
  handle("read-dir", async (dirPath) => {
    if (process.platform === "win32" && dirPath === "/") return listDrives()
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
  handle("delete-file", (filePath) => {
    if (isDriveRoot(filePath)) return { error: "EPERM" }
    return shell.trashItem(filePath)
  })
  handle("create-folder", async (dir) => {
    for (let i = 1; ; i++) {
      const name = i === 1 ? "New Folder" : `New Folder (${i})`
      const path = toPosix(join(dir, name))
      try {
        await fs.mkdir(path)
        return { path }
      } catch (err) {
        if (err.code !== "EEXIST") throw err
      }
    }
  })
  handle("rename", async (path, newPath) => {
    if (isDriveRoot(path)) return { error: "EPERM" }
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
    return { path: toPosix(app.getPath(name)) }
  })
  handle("move", async (oldPath, destDir, copy = false) => {
    if (isDriveRoot(oldPath)) return { error: "EPERM" }
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
  handle("load-settings", async () => {
    try {
      return JSON.parse(await fs.readFile(settingsPath(), "utf8"))
    } catch {
      return {}
    }
  })
  handle("save-settings", async (settings) => {
    const tmp = `${settingsPath()}.tmp`
    await fs.writeFile(tmp, JSON.stringify(settings, null, 2))
    await fs.rename(tmp, settingsPath())
  })
  handle("extract-archive", async (path) => {
    const zipFile = await openPromise(path)
    for await (let entry of zipFile.eachEntry()) {
      const destDir = join(dirname(path), basename(path, extname(path)))
      const outPath = resolve(destDir, entry.fileName)
      if (!outPath.startsWith(resolve(destDir) + sep)) continue

      if (entry.fileName.endsWith("/")) {
        await fs.mkdir(outPath, { recursive: true })
        continue
      }
      await fs.mkdir(dirname(outPath), { recursive: true })
      const readStream = await zipFile.openReadStreamPromise(entry)
      await pipeline(readStream, createWriteStream(outPath))
    }
  })
  handle("create-archive", async (paths, destZip) => {
    if (await exists(destZip)) return { error: "EEXIST" }

    const archive = new ZipArchive({ zlib: { level: 6 } })
    const done = pipeline(archive, createWriteStream(destZip))

    try {
      for (const p of paths) {
        if ((await fs.stat(p)).isDirectory()) archive.directory(p, basename(p))
        else archive.file(p, { name: basename(p) })
      }

      await archive.finalize()

      await done
    } catch (err) {
      await fs.rm(destZip, { force: true })
      throw err
    }
  })
  handle("list-drives", async () => {
    if (process.platform === "linux") {
      const output = await execFileAsync("findmnt", [
        "--json",
        "--real",
        "--list",
        "-o",
        "TARGET,SOURCE,FSTYPE,LABEL,SIZE"
      ])
      const mntList = JSON.parse(output.stdout).filesystems

      mntList.forEach((element) => {
        if (isValidDrive(element)) {
          console.log("ELEMENT:", element)
        }
      })
      return mntList
        .map((element) => (isValidDrive(element) ? element : null))
        .filter((element) => element != null)
    } else if (process.platform === "win32") {
      const drives = await listDrives()
      return drives.map((element) => ({ target: element.name }))
    }
  })
}
