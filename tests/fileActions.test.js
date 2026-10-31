import { beforeEach, describe, expect, it, vi } from "vitest"
import { deferred, mockApi } from "./helpers.js"
import { showToast } from "../src/renderer/src/utils/toast.js"
import {
  createFolder,
  deleteFile,
  moveFiles,
  openFile,
  rename
} from "../src/renderer/src/utils/fileActions.js"

vi.mock("../src/renderer/src/utils/toast.js", async (importOriginal) => ({
  ...(await importOriginal()),
  showToast: vi.fn()
}))

let api, refresh
beforeEach(() => {
  api = mockApi()
  refresh = vi.fn()
  vi.mocked(showToast).mockClear()
})

describe("deleteFile", () => {
  it("deletes every path and refreshes once", async () => {
    await deleteFile(["/a", "/b"], refresh)
    expect(api.deleteFile.mock.calls).toEqual([["/a"], ["/b"]])
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(showToast).not.toHaveBeenCalled()
  })

  it("shows a toast per failure", async () => {
    api.deleteFile.mockImplementation(async (p) => (p === "/b" ? { error: "EACCES" } : {}))
    await deleteFile(["/a", "/b"], refresh)
    expect(showToast).toHaveBeenCalledWith("Couldn't delete", "Permission denied", "error")
    expect(refresh).toHaveBeenCalledTimes(1)
  })
})

describe("createFolder", () => {
  it("returns the new path and refreshes", async () => {
    expect(await createFolder("/home", refresh)).toBe("/home/New Folder")
    expect(refresh).toHaveBeenCalled()
  })

  it("returns null and toasts on error", async () => {
    api.createFolder.mockResolvedValue({ error: "EACCES" })
    expect(await createFolder("/root", refresh)).toBeNull()
    expect(refresh).not.toHaveBeenCalled()
    expect(showToast).toHaveBeenCalledWith("Couldn't create folder", "Permission denied", "error")
  })
})

describe("rename", () => {
  it("returns true and refreshes on success", async () => {
    expect(await rename("/a", "/b", refresh)).toBe(true)
    expect(api.rename).toHaveBeenCalledWith("/a", "/b")
    expect(refresh).toHaveBeenCalled()
  })

  it("returns false and toasts on error", async () => {
    api.rename.mockResolvedValue({ error: "EEXIST" })
    expect(await rename("/a", "/b", refresh)).toBe(false)
    expect(refresh).not.toHaveBeenCalled()
    expect(showToast).toHaveBeenCalledWith(
      "Couldn't rename",
      "A file or folder with that name already exists",
      "error"
    )
  })
})

describe("openFile", () => {
  it("does nothing visible on success", async () => {
    await openFile("/a.txt")
    expect(showToast).not.toHaveBeenCalled()
  })

  it("warns when there is no default program", async () => {
    api.openFile.mockResolvedValue({ noProgram: true })
    await openFile("/a.xyz")
    expect(showToast).toHaveBeenCalledWith(
      "No default app",
      "No program is set to open this file type",
      "warning"
    )
  })

  it("shows the error string from openPath", async () => {
    api.openFile.mockResolvedValue({ error: "Failed to open" })
    await openFile("/a.txt")
    expect(showToast).toHaveBeenCalledWith("Couldn't open file", "Failed to open", "error")
  })
})

describe("moveFiles", () => {
  it("moves every file except the target itself", async () => {
    await moveFiles(["/a", "/dir", "/b"], "/dir", false, refresh)
    expect(api.move.mock.calls).toEqual([
      ["/a", "/dir", false],
      ["/b", "/dir", false]
    ])
  })

  it("refreshes only after all moves finished", async () => {
    const slow = deferred()
    api.move.mockReturnValue(slow.promise)
    const done = moveFiles(["/a"], "/dir", false, refresh)
    await Promise.resolve()
    expect(refresh).not.toHaveBeenCalled()
    slow.resolve({ success: true })
    await done
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it("uses copy wording in errors", async () => {
    api.move.mockResolvedValue({ error: "EEXIST" })
    await moveFiles(["/a"], "/dir", true, refresh)
    expect(showToast).toHaveBeenCalledWith(
      "Couldn't copy file",
      "A file or folder with that name already exists",
      "error"
    )
  })
})
