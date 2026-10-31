import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { deferred, dir, file, mockApi } from "./helpers.js"
import { showToast } from "../src/renderer/src/utils/toast.js"
import { TabsProvider, useTabs } from "../src/renderer/src/hooks/useTabs.jsx"

vi.mock("../src/renderer/src/utils/toast.js", async (importOriginal) => ({
  ...(await importOriginal()),
  showToast: vi.fn()
}))

let tree
function readDir(path) {
  return tree[path] ?? { error: "ENOENT" }
}

beforeEach(() => {
  tree = {
    "/": [dir("home"), file("a.txt")],
    "/home": [dir("user")],
    "/home/user": [file("notes.md"), file("todo.md")]
  }
  mockApi({ readDir: vi.fn(async (path) => readDir(path)) })
  vi.mocked(showToast).mockClear()
})

async function setup() {
  const hook = renderHook(useTabs, { wrapper: TabsProvider })
  await waitFor(() => expect(hook.result.current.getFiles("1")).toEqual(tree["/"]))
  return hook.result
}
const tab = (result, id = "1") => result.current.getTab(id)

describe("initial state", () => {
  it("loads / into the first tab", async () => {
    const result = await setup()
    expect(result.current.tabs).toHaveLength(1)
    expect(tab(result)).toMatchObject({ path: "/", history: ["/"], historyIndex: 0 })
    expect(result.current.activeTab).toBe("1")
  })
})

describe("navigate", () => {
  it("loads the folder, pushes history and clears the selection", async () => {
    const result = await setup()
    act(() => result.current.setSelectedFiles(["/a.txt"]))

    let ok
    await act(async () => (ok = await result.current.navigate("1", "/home")))

    expect(ok).toBe(true)
    expect(tab(result)).toMatchObject({ path: "/home", history: ["/", "/home"], historyIndex: 1 })
    expect(tab(result).files).toEqual(tree["/home"])
    expect(result.current.selectedFiles).toEqual([])
  })

  it("normalizes trailing slashes", async () => {
    const result = await setup()
    await act(() => result.current.navigate("1", "/home/user/"))
    expect(tab(result).path).toBe("/home/user")
  })

  it("does not add a history entry for the current folder", async () => {
    const result = await setup()
    await act(() => result.current.navigate("1", "/home"))
    await act(() => result.current.navigate("1", "/home/"))
    expect(tab(result).history).toEqual(["/", "/home"])
  })

  it("drops forward history when navigating after going back", async () => {
    const result = await setup()
    await act(() => result.current.navigate("1", "/home"))
    await act(() => result.current.navigate("1", "/home/user"))
    await act(() => result.current.moveInHistory("1", -2))
    await act(() => result.current.navigate("1", "/home"))
    expect(tab(result)).toMatchObject({ history: ["/", "/home"], historyIndex: 1 })
  })

  it("returns false, toasts and keeps the tab and selection on error", async () => {
    const result = await setup()
    act(() => result.current.setSelectedFiles(["/a.txt"]))

    let ok
    await act(async () => (ok = await result.current.navigate("1", "/nope")))

    expect(ok).toBe(false)
    expect(tab(result)).toMatchObject({ path: "/", history: ["/"] })
    expect(result.current.selectedFiles).toEqual(["/a.txt"])
    expect(showToast).toHaveBeenCalledWith(
      "Can't open folder",
      `"/nope" - The file or folder doesn't exist`,
      "error"
    )
  })

  it("ignores a slower earlier load", async () => {
    const result = await setup()
    const slow = deferred()
    window.api.readDir.mockImplementation(async (path) =>
      path === "/home" ? slow.promise : readDir(path)
    )

    let first
    await act(async () => {
      first = result.current.navigate("1", "/home")
      await result.current.navigate("1", "/home/user")
    })
    await act(async () => {
      slow.resolve(tree["/home"])
      expect(await first).toBe(false)
    })

    expect(tab(result)).toMatchObject({ path: "/home/user", history: ["/", "/home/user"] })
  })
})

describe("history", () => {
  it("moves back and forward and reports what is possible", async () => {
    const result = await setup()
    expect(result.current.canMoveHistory("1")).toEqual({ backwards: false, forwards: false })

    await act(() => result.current.navigate("1", "/home"))
    await act(() => result.current.navigate("1", "/home/user"))
    await act(() => result.current.moveInHistory("1", -1))

    expect(tab(result)).toMatchObject({ path: "/home", historyIndex: 1 })
    expect(result.current.canMoveHistory("1")).toEqual({ backwards: true, forwards: true })

    await act(() => result.current.moveInHistory("1", 1))
    expect(tab(result)).toMatchObject({ path: "/home/user", historyIndex: 2 })
  })

  it("ignores steps outside the history", async () => {
    const result = await setup()
    window.api.readDir.mockClear()
    await act(() => result.current.moveInHistory("1", -1))
    await act(() => result.current.moveInHistory("1", 1))
    expect(window.api.readDir).not.toHaveBeenCalled()
  })
})

describe("tabs", () => {
  it("adds, finds neighbours and removes tabs", async () => {
    const result = await setup()
    act(() => result.current.addTab("/home"))
    const id = result.current.tabs[1].id

    await waitFor(() => expect(result.current.getFiles(id)).toEqual(tree["/home"]))
    expect(result.current.getPath(id)).toBe("/home")
    expect(result.current.getNeighbourID("1", 1)).toBe(id)
    expect(result.current.getNeighbourID("1", -1)).toBeNull()
    expect(result.current.getNeighbourID(id, -1)).toBe("1")

    act(() => result.current.removeTab(id))
    expect(result.current.tabs.map((t) => t.id)).toEqual(["1"])
  })

  it("addTab defaults to /", async () => {
    const result = await setup()
    act(() => result.current.addTab())
    expect(result.current.tabs[1]).toMatchObject({ path: "/", history: ["/"] })
  })

  it("setActiveTab clears the selection", async () => {
    const result = await setup()
    act(() => result.current.addTab())
    act(() => result.current.setSelectedFiles(["/a.txt"]))
    act(() => result.current.setActiveTab(result.current.tabs[1].id))
    expect(result.current.activeTab).toBe(result.current.tabs[1].id)
    expect(result.current.selectedFiles).toEqual([])
  })
})

describe("getSelectedEntry", () => {
  it("finds the file entry for a full path", async () => {
    const result = await setup()
    await act(() => result.current.navigate("1", "/home/user"))
    expect(result.current.getSelectedEntry("1", "/home/user/notes.md")).toEqual(file("notes.md"))
    expect(result.current.getSelectedEntry("1", "/home/user/missing")).toBeUndefined()
  })
})

describe("refresh", () => {
  it("reloads files and bumps treeVersion", async () => {
    const result = await setup()
    const version = result.current.treeVersion
    tree["/"] = [...tree["/"], file("b.txt")]

    await act(async () => result.current.refresh())
    await waitFor(() => expect(result.current.getFiles("1")).toEqual(tree["/"]))
    expect(result.current.treeVersion).toBe(version + 1)
  })

  it("climbs to the nearest existing parent and replaces the history entry", async () => {
    const result = await setup()
    await act(() => result.current.navigate("1", "/home"))
    await act(() => result.current.navigate("1", "/home/user"))
    delete tree["/home/user"]

    await act(async () => result.current.refresh())
    await waitFor(() => expect(tab(result).path).toBe("/home"))
    expect(tab(result)).toMatchObject({ history: ["/", "/home", "/home"], historyIndex: 2 })
    expect(showToast).toHaveBeenCalledWith(
      "Folder no longer exists",
      `"/home/user" - The file or folder doesn't exist`,
      "error"
    )
  })

  it("drops selected files that no longer exist", async () => {
    const result = await setup()
    await act(() => result.current.navigate("1", "/home/user"))
    act(() => result.current.setSelectedFiles(["/home/user/notes.md", "/home/user/todo.md"]))
    tree["/home/user"] = [file("todo.md")]

    await act(async () => result.current.refresh())
    await waitFor(() => expect(result.current.selectedFiles).toEqual(["/home/user/todo.md"]))
  })

  it("does not jump back when the tab navigated during the refresh", async () => {
    const result = await setup()
    const slow = deferred()
    window.api.readDir.mockImplementation(async (path) =>
      path === "/" ? slow.promise : readDir(path)
    )

    act(() => result.current.refresh())
    await act(() => result.current.navigate("1", "/home"))
    await act(async () => slow.resolve(tree["/"]))

    expect(tab(result).path).toBe("/home")
  })
})
