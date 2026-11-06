import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { mockApi } from "./helpers.js"
import { createFolder, deleteFile, openFile } from "../src/renderer/src/utils/fileActions.js"
import { showToast } from "../src/renderer/src/utils/toast.js"
import ContextMenu from "../src/renderer/src/components/ContextMenu.jsx"

let ui, tabs
vi.mock("../src/renderer/src/hooks/useUI.jsx", () => ({ useUI: () => ui }))
vi.mock("../src/renderer/src/hooks/useTabs.jsx", () => ({ useTabs: () => tabs }))
vi.mock("../src/renderer/src/utils/fileActions.js", () => ({
  createFolder: vi.fn(async () => null),
  deleteFile: vi.fn(async () => {}),
  openFile: vi.fn(async () => {})
}))
vi.mock("../src/renderer/src/utils/toast.js", async (importOriginal) => ({
  ...(await importOriginal()),
  showToast: vi.fn()
}))

const fileMenu = (target, isDirectory = false) => ({ x: 10, y: 20, type: "file", target, isDirectory })
const backgroundMenu = { x: 10, y: 20, type: "background", target: null, isDirectory: false }
const tabMenu = (id) => ({ x: 10, y: 20, type: "tab", target: id, isDirectory: false })

function setup(menu, tabOverrides = {}) {
  ui = { menu, setMenu: vi.fn(), setRenaming: vi.fn(), setPropertiesShown: vi.fn() }
  tabs = {
    activeTab: "1",
    tabs: [{ id: "1" }, { id: "2" }],
    selectedFiles: ["/home/user/a.txt"],
    setSelectedFiles: vi.fn(),
    setActiveTab: vi.fn(),
    navigate: vi.fn(),
    addTab: vi.fn(),
    getPath: () => "/home/user",
    removeTab: vi.fn(),
    getNeighbourID: vi.fn(),
    refresh: vi.fn(),
    ...tabOverrides
  }
  return render(<ContextMenu />)
}

const itemNames = () => screen.queryAllByRole("button").map((b) => b.textContent)
const click = (name) => fireEvent.click(screen.getByRole("button", { name }))

beforeEach(() => {
  vi.clearAllMocks()
  mockApi({ extractArchive: vi.fn(async () => ({ success: true })) })
})

describe("visibility", () => {
  it("renders nothing without a menu", () => {
    const { container } = setup(null)
    expect(container.innerHTML).toBe("")
  })

  it("is positioned at the click", () => {
    const { container } = setup(fileMenu("/home/user/a.txt"))
    const menu = container.querySelector(".context-menu")
    expect(menu.style.left).toBe("10px")
    expect(menu.style.top).toBe("20px")
  })

  it("shows file items for a file", () => {
    setup(fileMenu("/home/user/a.txt"))
    expect(itemNames()).toEqual(["Open", "Open With", "New Folder", "Properties", "Delete"])
  })

  it("adds Open in new Tab for folders", () => {
    setup(fileMenu("/home/user/docs", true))
    expect(itemNames()).toContain("Open in new Tab")
  })

  // App sets target to null when right-clicking empty space
  it("shows only New Folder on the background", () => {
    setup(backgroundMenu)
    expect(itemNames()).toEqual(["New Folder"])
  })

  it("shows Close Tab and New Folder for a tab", () => {
    setup(tabMenu("2"))
    expect(itemNames()).toEqual(["New Folder", "Close Tab"])
  })

  it("separates groups with dividers", () => {
    const { container } = setup(fileMenu("/home/user/a.txt"))
    expect(container.querySelectorAll(".context-menu-divider")).toHaveLength(2)
  })
})

describe("Extract", () => {
  it.each(["/home/user/photos.zip", "/home/user/my.backup.zip"])("is shown for %s", (target) => {
    setup(fileMenu(target))
    expect(itemNames()).toContain("Extract")
  })

  it("is case-insensitive", () => {
    setup(fileMenu("/home/user/PHOTOS.ZIP"))
    expect(itemNames()).toContain("Extract")
  })

  it.each(["/home/user/a.txt", "/home/user/zip", "/home/user/archive.zip.txt"])(
    "is hidden for %s",
    (target) => {
      setup(fileMenu(target))
      expect(itemNames()).not.toContain("Extract")
    }
  )

  it("calls extractArchive with the full path and closes", async () => {
    setup(fileMenu("/home/user/photos.zip"))
    click("Extract")
    await waitFor(() => expect(ui.setMenu).toHaveBeenCalledWith(null))
    expect(window.api.extractArchive).toHaveBeenCalledWith("/home/user/photos.zip")
  })

  it("refreshes the folder after extracting", async () => {
    setup(fileMenu("/home/user/photos.zip"))
    click("Extract")
    await waitFor(() => expect(tabs.refresh).toHaveBeenCalled())
  })

  it("shows a toast when extraction fails", async () => {
    window.api.extractArchive.mockResolvedValueOnce({ error: "ENOENT" })
    setup(fileMenu("/home/user/photos.zip"))
    click("Extract")
    await waitFor(() => expect(showToast).toHaveBeenCalled())
    expect(vi.mocked(showToast).mock.calls[0][2]).toBe("error")
  })
})

describe("selection on open", () => {
  it("selects the clicked file if it was not selected", () => {
    setup(fileMenu("/home/user/b.txt"))
    const updater = tabs.setSelectedFiles.mock.calls[0][0]
    expect(updater(["/home/user/a.txt"])).toEqual(["/home/user/b.txt"])
  })

  it("keeps a multi-selection that includes the clicked file", () => {
    setup(fileMenu("/home/user/a.txt"))
    const updater = tabs.setSelectedFiles.mock.calls[0][0]
    const prev = ["/home/user/a.txt", "/home/user/b.txt"]
    expect(updater(prev)).toBe(prev)
  })

  it("activates the right-clicked tab", () => {
    setup(tabMenu("2"))
    expect(tabs.setActiveTab).toHaveBeenCalledWith("2")
  })
})

describe("actions", () => {
  it("Open navigates into folders", async () => {
    setup(fileMenu("/home/user/docs", true))
    click("Open")
    await waitFor(() => expect(ui.setMenu).toHaveBeenCalledWith(null))
    expect(tabs.navigate).toHaveBeenCalledWith("1", "/home/user/docs")
    expect(openFile).not.toHaveBeenCalled()
  })

  it("Open opens files", async () => {
    setup(fileMenu("/home/user/a.txt"))
    click("Open")
    await waitFor(() => expect(openFile).toHaveBeenCalledWith("/home/user/a.txt"))
  })

  it("Open in new Tab adds a tab", async () => {
    setup(fileMenu("/home/user/docs", true))
    click("Open in new Tab")
    await waitFor(() => expect(tabs.addTab).toHaveBeenCalledWith("/home/user/docs"))
  })

  it("New Folder creates in the current folder, selects it and starts renaming", async () => {
    vi.mocked(createFolder).mockResolvedValueOnce("/home/user/New Folder")
    setup(fileMenu("/home/user/a.txt"))
    click("New Folder")
    await waitFor(() => expect(ui.setRenaming).toHaveBeenCalledWith(true))
    expect(createFolder).toHaveBeenCalledWith("/home/user", tabs.refresh)
    expect(tabs.setSelectedFiles).toHaveBeenCalledWith(["/home/user/New Folder"])
  })

  it("New Folder does not start renaming when creation failed", async () => {
    setup(fileMenu("/home/user/a.txt"))
    click("New Folder")
    await waitFor(() => expect(ui.setMenu).toHaveBeenCalledWith(null))
    expect(ui.setRenaming).not.toHaveBeenCalled()
  })

  it("Properties opens the properties panel", async () => {
    setup(fileMenu("/home/user/a.txt"))
    click("Properties")
    await waitFor(() => expect(ui.setPropertiesShown).toHaveBeenCalledWith(true))
  })

  it("Delete deletes the whole selection", async () => {
    setup(fileMenu("/home/user/a.txt"), { selectedFiles: ["/home/user/a.txt", "/home/user/b"] })
    click("Delete")
    await waitFor(() =>
      expect(deleteFile).toHaveBeenCalledWith(["/home/user/a.txt", "/home/user/b"], tabs.refresh)
    )
  })

  it("Close Tab activates the left neighbour and removes the tab", async () => {
    setup(tabMenu("2"), { getNeighbourID: vi.fn((id, dir) => (dir === -1 ? "1" : null)) })
    click("Close Tab")
    await waitFor(() => expect(tabs.removeTab).toHaveBeenCalledWith("2"))
    expect(tabs.setActiveTab).toHaveBeenLastCalledWith("1")
  })

  it("Close Tab falls back to the right neighbour", async () => {
    setup(tabMenu("1"), { getNeighbourID: vi.fn((id, dir) => (dir === 1 ? "2" : null)) })
    click("Close Tab")
    await waitFor(() => expect(tabs.removeTab).toHaveBeenCalledWith("1"))
    expect(tabs.setActiveTab).toHaveBeenLastCalledWith("2")
  })

  it("Close Tab refuses to close the last tab", async () => {
    setup(tabMenu("1"), { tabs: [{ id: "1" }] })
    click("Close Tab")
    await waitFor(() => expect(showToast).toHaveBeenCalled())
    expect(tabs.removeTab).not.toHaveBeenCalled()
  })
})

describe("closing", () => {
  it("closes on a click outside", () => {
    setup(fileMenu("/home/user/a.txt"))
    fireEvent.click(document.body)
    expect(ui.setMenu).toHaveBeenCalledWith(null)
  })

  it("stays open on a click inside", () => {
    const { container } = setup(fileMenu("/home/user/a.txt"))
    fireEvent.click(container.querySelector(".context-menu-divider"))
    expect(ui.setMenu).not.toHaveBeenCalled()
  })
})
