// @vitest-environment node
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import fs from "node:fs/promises"
import os from "node:os"
import { join } from "node:path"
import { execFile } from "node:child_process"
import { crc32 } from "node:zlib"
import { app, shell } from "electron"
import { registerIpcHandlers } from "../src/main/ipc.js"

const handlers = {}
vi.mock("electron", () => ({
  app: { getPath: vi.fn() },
  ipcMain: { handle: vi.fn((channel, fn) => (handlers[channel] = fn)) },
  shell: { trashItem: vi.fn(async () => {}), openPath: vi.fn(async () => "") }
}))
vi.mock("node:child_process", () => ({ execFile: vi.fn() }))

const call = (channel, ...args) => handlers[channel]({}, ...args)
const realPlatform = process.platform
const setPlatform = (value) => Object.defineProperty(process, "platform", { value })

let tmp
beforeAll(() => registerIpcHandlers())
beforeEach(async () => {
  tmp = await fs.mkdtemp(join(os.tmpdir(), "tailfe-test-"))
  vi.clearAllMocks()
})
afterEach(async () => {
  setPlatform(realPlatform)
  await fs.rm(tmp, { recursive: true, force: true })
})
afterAll(() => setPlatform(realPlatform))

describe("read-dir", () => {
  it("lists entries with type, size and date", async () => {
    await fs.mkdir(join(tmp, "folder"))
    await fs.writeFile(join(tmp, "a.txt"), "hello")

    const entries = await call("read-dir", tmp)
    const byName = Object.fromEntries(entries.map((e) => [e.name, e]))

    expect(byName["folder"].isDirectory).toBe(true)
    expect(byName["a.txt"]).toMatchObject({ isDirectory: false, size: 5 })
    expect(byName["a.txt"].lastModified).toBeInstanceOf(Date)
  })

  it("falls back to the dirent type for broken symlinks", async () => {
    await fs.symlink(join(tmp, "missing"), join(tmp, "link"))
    const [entry] = await call("read-dir", tmp)
    expect(entry).toMatchObject({
      name: "link",
      isDirectory: false,
      size: null,
      lastModified: null
    })
  })

  it("returns the error code for a missing folder", async () => {
    expect(await call("read-dir", join(tmp, "nope"))).toEqual({ error: "ENOENT" })
  })

  it("lists drives instead of / on Windows", async () => {
    setPlatform("win32")
    const entries = await call("read-dir", "/")
    expect(Array.isArray(entries)).toBe(true)
    for (const e of entries)
      expect(e).toMatchObject({ name: expect.stringMatching(/^[A-Z]:$/), isDirectory: true })
  })
})

describe("create-folder", () => {
  it("creates New Folder, then numbered ones", async () => {
    expect(await call("create-folder", tmp)).toEqual({ path: join(tmp, "New Folder") })
    expect(await call("create-folder", tmp)).toEqual({ path: join(tmp, "New Folder (2)") })
    expect((await fs.stat(join(tmp, "New Folder (2)"))).isDirectory()).toBe(true)
  })

  it("returns the error for a missing parent", async () => {
    expect(await call("create-folder", join(tmp, "nope"))).toEqual({ error: "ENOENT" })
  })
})

describe("rename", () => {
  it("renames a file", async () => {
    await fs.writeFile(join(tmp, "a"), "")
    expect(await call("rename", join(tmp, "a"), join(tmp, "b"))).toEqual({ success: true })
    await expect(fs.access(join(tmp, "b"))).resolves.toBeUndefined()
  })

  it("refuses to overwrite", async () => {
    await fs.writeFile(join(tmp, "a"), "1")
    await fs.writeFile(join(tmp, "b"), "2")
    expect(await call("rename", join(tmp, "a"), join(tmp, "b"))).toEqual({ error: "EEXIST" })
    expect(await fs.readFile(join(tmp, "b"), "utf8")).toBe("2")
  })
})

describe("move", () => {
  beforeEach(async () => {
    await fs.mkdir(join(tmp, "dest"))
    await fs.mkdir(join(tmp, "src"))
    await fs.writeFile(join(tmp, "src", "inner.txt"), "x")
  })

  it("moves a folder", async () => {
    expect(await call("move", join(tmp, "src"), join(tmp, "dest"))).toEqual({ success: true })
    await expect(fs.access(join(tmp, "src"))).rejects.toThrow()
    expect(await fs.readFile(join(tmp, "dest", "src", "inner.txt"), "utf8")).toBe("x")
  })

  it("copies recursively and keeps the original", async () => {
    expect(await call("move", join(tmp, "src"), join(tmp, "dest"), true)).toEqual({ success: true })
    await expect(fs.access(join(tmp, "src", "inner.txt"))).resolves.toBeUndefined()
    expect(await fs.readFile(join(tmp, "dest", "src", "inner.txt"), "utf8")).toBe("x")
  })

  it("refuses to overwrite", async () => {
    await fs.mkdir(join(tmp, "dest", "src"))
    expect(await call("move", join(tmp, "src"), join(tmp, "dest"))).toEqual({ error: "EEXIST" })
  })
})

describe("delete-file", () => {
  it("moves the file to the trash", async () => {
    expect(await call("delete-file", "/x/y")).toEqual({ success: true })
    expect(shell.trashItem).toHaveBeenCalledWith("/x/y")
  })

  it("returns the trash error", async () => {
    shell.trashItem.mockRejectedValueOnce(Object.assign(new Error("no"), { code: "EACCES" }))
    expect(await call("delete-file", "/x/y")).toEqual({ error: "EACCES" })
  })
})

describe("drive roots on Windows", () => {
  beforeEach(() => setPlatform("win32"))

  it.each(["C:", "C:/", "C:\\", "d:/"])("refuses to delete, rename or move %s", async (drive) => {
    expect(await call("delete-file", drive)).toEqual({ error: "EPERM" })
    expect(await call("rename", drive, "C:/x")).toEqual({ error: "EPERM" })
    expect(await call("move", drive, "C:/x")).toEqual({ error: "EPERM" })
    expect(shell.trashItem).not.toHaveBeenCalled()
  })

  it("still allows folders on a drive", async () => {
    expect(await call("delete-file", "C:/Users/me/x")).toEqual({ success: true })
  })

  it("does not apply on Linux", async () => {
    setPlatform("linux")
    expect(await call("delete-file", "C:")).toEqual({ success: true })
  })
})

describe("get-path", () => {
  it("rejects names that are not allowed", async () => {
    expect(await call("get-path", "appData")).toEqual({ error: "EINVAL" })
    expect(app.getPath).not.toHaveBeenCalled()
  })

  it("returns the path as is on Linux", async () => {
    app.getPath.mockReturnValue("/home/u/odd\\name")
    expect(await call("get-path", "home")).toEqual({ path: "/home/u/odd\\name" })
  })

  it("uses forward slashes on Windows", async () => {
    setPlatform("win32")
    app.getPath.mockReturnValue("C:\\Users\\me\\Downloads")
    expect(await call("get-path", "downloads")).toEqual({ path: "C:/Users/me/Downloads" })
  })
})

describe("open-file", () => {
  function mockXdg(defaultApp) {
    execFile.mockImplementation((cmd, args, cb) => {
      const stdout = args[1] === "filetype" ? "text/plain\n" : `${defaultApp}\n`
      cb(null, { stdout, stderr: "" })
    })
  }

  it("opens files that have a default program", async () => {
    mockXdg("org.gnome.TextEditor.desktop")
    expect(await call("open-file", "/a.txt")).toEqual({ success: true })
    expect(shell.openPath).toHaveBeenCalledWith("/a.txt")
  })

  it("reports noProgram when there is no default or it is a file manager", async () => {
    mockXdg("")
    expect(await call("open-file", "/a.xyz")).toEqual({ noProgram: true })
    mockXdg("org.gnome.Nautilus.desktop")
    expect(await call("open-file", "/a.xyz")).toEqual({ noProgram: true })
    expect(shell.openPath).not.toHaveBeenCalled()
  })

  it("reports noProgram when xdg-mime fails", async () => {
    execFile.mockImplementation((cmd, args, cb) => cb(new Error("not found")))
    expect(await call("open-file", "/a.txt")).toEqual({ noProgram: true })
  })

  it.each(["win32", "darwin"])("opens files on %s without xdg-mime", async (platform) => {
    setPlatform(platform)
    execFile.mockImplementation((cmd, args, cb) => cb(new Error("spawn xdg-mime ENOENT")))

    expect(await call("open-file", "/a.txt")).toEqual({ success: true })
    expect(execFile).not.toHaveBeenCalled()
    expect(shell.openPath).toHaveBeenCalledWith("/a.txt")
  })

  it("returns the openPath error string", async () => {
    mockXdg("org.gnome.TextEditor.desktop")
    shell.openPath.mockResolvedValueOnce("Failed to open")
    expect(await call("open-file", "/a.txt")).toEqual({ error: "Failed to open" })
  })
})

describe("load-settings / save-settings", () => {
  beforeEach(() => app.getPath.mockImplementation((name) => (name === "userData" ? tmp : "")))

  it("returns {} when there is no settings file", async () => {
    expect(await call("load-settings")).toEqual({})
  })

  it("returns {} for a corrupt settings file", async () => {
    await fs.writeFile(join(tmp, "settings.json"), "{ not json")
    expect(await call("load-settings")).toEqual({})
  })

  it("round-trips saved settings", async () => {
    const settings = { showDotFiles: true, columnWidths: { nameCol: 123 } }
    expect(await call("save-settings", settings)).toEqual({ success: true })
    expect(await call("load-settings")).toEqual(settings)
  })

  it("does not leave the temp file behind", async () => {
    await call("save-settings", { a: 1 })
    expect(await fs.readdir(tmp)).toEqual(["settings.json"])
  })
})

// Builds an uncompressed ("stored") zip so tests can use names a real zip tool would refuse
function makeZip(entries) {
  const u16 = (n) => Buffer.from([n & 0xff, (n >> 8) & 0xff])
  const u32 = (n) => {
    const b = Buffer.alloc(4)
    b.writeUInt32LE(n >>> 0)
    return b
  }
  const locals = []
  const centrals = []
  let offset = 0
  for (const [name, content = ""] of Object.entries(entries)) {
    const nameBuf = Buffer.from(name)
    const data = Buffer.from(content)
    const crc = crc32(data)
    const shared = [u16(0), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length)]
    const local = Buffer.concat([
      u32(0x04034b50), u16(20), ...shared, u16(nameBuf.length), u16(0), nameBuf, data
    ])
    centrals.push(
      Buffer.concat([
        u32(0x02014b50), u16(20), u16(20), ...shared, u16(nameBuf.length), u16(0), u16(0),
        u16(0), u16(0), u32(0), u32(offset), nameBuf
      ])
    )
    locals.push(local)
    offset += local.length
  }
  const central = Buffer.concat(centrals)
  const count = centrals.length
  const end = Buffer.concat([
    u32(0x06054b50), u16(0), u16(0), u16(count), u16(count), u32(central.length), u32(offset),
    u16(0)
  ])
  return Buffer.concat([...locals, central, end])
}

describe("extract-archive", () => {
  async function writeZip(entries, name = "photos.zip") {
    const path = join(tmp, name)
    await fs.writeFile(path, makeZip(entries))
    return path
  }

  it("extracts into a folder named after the archive", async () => {
    const zip = await writeZip({ "a.txt": "hello", "b.txt": "world" })
    expect(await call("extract-archive", zip)).toEqual({ success: true })
    expect(await fs.readFile(join(tmp, "photos", "a.txt"), "utf8")).toBe("hello")
    expect(await fs.readFile(join(tmp, "photos", "b.txt"), "utf8")).toBe("world")
  })

  it("keeps the archive", async () => {
    const zip = await writeZip({ "a.txt": "x" })
    await call("extract-archive", zip)
    await expect(fs.access(zip)).resolves.toBeUndefined()
  })

  it("recreates nested folders, with or without folder entries", async () => {
    const zip = await writeZip({
      "docs/": "",
      "docs/readme.md": "# hi",
      "deep/er/still/file.txt": "nested"
    })
    expect(await call("extract-archive", zip)).toEqual({ success: true })
    expect(await fs.readFile(join(tmp, "photos", "docs", "readme.md"), "utf8")).toBe("# hi")
    expect(await fs.readFile(join(tmp, "photos", "deep/er/still/file.txt"), "utf8")).toBe("nested")
    expect((await fs.stat(join(tmp, "photos", "docs"))).isDirectory()).toBe(true)
  })

  it("creates empty folders from folder entries", async () => {
    const zip = await writeZip({ "empty/": "" })
    await call("extract-archive", zip)
    expect((await fs.stat(join(tmp, "photos", "empty"))).isDirectory()).toBe(true)
  })

  it("only strips the last extension from the folder name", async () => {
    const zip = await writeZip({ "a.txt": "x" }, "backup.2024.zip")
    await call("extract-archive", zip)
    expect(await fs.readFile(join(tmp, "backup.2024", "a.txt"), "utf8")).toBe("x")
  })

  it("never writes outside the destination folder (zip slip)", async () => {
    const zip = await writeZip({ "../evil.txt": "pwned", "ok.txt": "fine" })
    const result = await call("extract-archive", zip)
    await expect(fs.access(join(tmp, "evil.txt"))).rejects.toThrow()
    // yauzl rejects ../ names itself, so the whole extraction reports an error
    expect(result.error).toMatch(/invalid relative path/)
  })

  it("returns an error for a missing archive", async () => {
    expect(await call("extract-archive", join(tmp, "nope.zip"))).toEqual({ error: "ENOENT" })
  })

  it("returns an error for a file that is not a zip", async () => {
    await fs.writeFile(join(tmp, "fake.zip"), "definitely not a zip")
    const result = await call("extract-archive", join(tmp, "fake.zip"))
    expect(result.error).toBeTruthy()
  })
})
