import { describe, expect, it, vi } from "vitest"
import { importForPlatform } from "./helpers.js"

const PATHS = "../src/renderer/src/utils/paths.js"

describe("paths (linux)", async () => {
  const p = await importForPlatform("linux", PATHS)

  it("IS_WIN is false", () => {
    expect(p.IS_WIN).toBe(false)
  })

  it("concatPath joins and collapses slashes", () => {
    expect(p.concatPath("/", "home")).toBe("/home")
    expect(p.concatPath("/home", "user")).toBe("/home/user")
    expect(p.concatPath("/home/", "user")).toBe("/home/user")
    expect(p.concatPath("/", "/")).toBe("/")
  })

  it("removeLastPathElement goes up one level and stops at /", () => {
    expect(p.removeLastPathElement("/home/user")).toBe("/home")
    expect(p.removeLastPathElement("/home")).toBe("/")
    expect(p.removeLastPathElement("/")).toBe("/")
  })

  it("getCurrentDirName returns the last segment", () => {
    expect(p.getCurrentDirName("/home/user")).toBe("user")
    expect(p.getCurrentDirName("/")).toBe("/")
  })

  it("normalizePath strips trailing slashes but keeps the root", () => {
    expect(p.normalizePath("/home/user/")).toBe("/home/user")
    expect(p.normalizePath("/home/user//")).toBe("/home/user")
    expect(p.normalizePath("/")).toBe("/")
    expect(p.normalizePath("//")).toBe("/")
  })

  it("normalizePath leaves backslashes alone", () => {
    expect(p.normalizePath("/tmp/a\\b")).toBe("/tmp/a\\b")
  })

  it("pathParts builds a breadcrumb per segment", () => {
    expect(p.pathParts("/")).toEqual([])
    expect(p.pathParts("/home/user")).toEqual([
      { label: "home", path: "/home" },
      { label: "user", path: "/home/user" }
    ])
  })

  it("hasDirectories detects folders", () => {
    expect(p.hasDirectories([{ isDirectory: false }])).toBe(false)
    expect(p.hasDirectories([{ isDirectory: false }, { isDirectory: true }])).toBe(true)
  })

  it("readDirSafe only calls back on success", async () => {
    const onSuccess = vi.fn()
    window.api.readDir = vi.fn(async (path) => (path === "/ok" ? ["x"] : { error: "ENOENT" }))
    p.readDirSafe("/ok", onSuccess)
    p.readDirSafe("/missing", onSuccess)
    await vi.waitFor(() => expect(window.api.readDir).toHaveBeenCalledTimes(2))
    await Promise.resolve()
    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith(["x"])
  })
})

describe("paths (windows)", async () => {
  const p = await importForPlatform("win32", PATHS)

  it("IS_WIN is true", () => {
    expect(p.IS_WIN).toBe(true)
  })

  it("concatPath turns a drive under This PC into a drive root", () => {
    expect(p.concatPath("/", "C:")).toBe("C:/")
    expect(p.concatPath("C:/", "Users")).toBe("C:/Users")
    expect(p.concatPath("C:/Users", "me")).toBe("C:/Users/me")
    expect(p.concatPath("/", "/")).toBe("/")
  })

  it("removeLastPathElement goes from folder to drive root to This PC", () => {
    expect(p.removeLastPathElement("C:/Users/me")).toBe("C:/Users")
    expect(p.removeLastPathElement("C:/Users")).toBe("C:/")
    expect(p.removeLastPathElement("C:/")).toBe("/")
    expect(p.removeLastPathElement("/")).toBe("/")
  })

  it("getCurrentDirName names This PC and drives", () => {
    expect(p.getCurrentDirName("/")).toBe("This PC")
    expect(p.getCurrentDirName("C:/")).toBe("C:")
    expect(p.getCurrentDirName("C:/Users")).toBe("Users")
  })

  it("normalizePath converts backslashes, uppercases the drive and keeps drive roots", () => {
    expect(p.normalizePath("c:\\Users\\me\\")).toBe("C:/Users/me")
    expect(p.normalizePath("C:")).toBe("C:/")
    expect(p.normalizePath("c:/")).toBe("C:/")
    expect(p.normalizePath("C:\\")).toBe("C:/")
    expect(p.normalizePath("/")).toBe("/")
  })

  it("pathParts starts with the drive", () => {
    expect(p.pathParts("/")).toEqual([])
    expect(p.pathParts("C:/")).toEqual([{ label: "C:", path: "C:/" }])
    expect(p.pathParts("C:/Users/me")).toEqual([
      { label: "C:", path: "C:/" },
      { label: "Users", path: "C:/Users" },
      { label: "me", path: "C:/Users/me" }
    ])
  })
})
