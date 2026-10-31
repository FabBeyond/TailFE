// @vitest-environment node
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import fs from "node:fs/promises"
import os from "node:os"
import { join } from "node:path"
import { execFile } from "node:child_process"
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

  it("returns the openPath error string", async () => {
    mockXdg("org.gnome.TextEditor.desktop")
    shell.openPath.mockResolvedValueOnce("Failed to open")
    expect(await call("open-file", "/a.txt")).toEqual({ error: "Failed to open" })
  })
})
