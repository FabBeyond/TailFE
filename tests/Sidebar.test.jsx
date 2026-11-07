import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { dir, file, mockApi } from "./helpers.js"
import { SettingsProvider, useSettings } from "../src/renderer/src/hooks/useSettings.jsx"
import { Sidebar } from "../src/renderer/src/components/Sidebar.jsx"

let tabs
vi.mock("../src/renderer/src/hooks/useTabs.jsx", () => ({ useTabs: () => tabs }))

const tree = {
  "/": [dir("home"), dir(".config"), file("a.txt")],
  "/home": [dir("user")],
  "/home/user": []
}

let settings
function SettingsSpy() {
  settings = useSettings()
  return null
}

function setup(initialSettings) {
  tabs = { activeTab: "1", navigate: vi.fn(), treeVersion: 0 }
  // A fresh element each time: re-rendering the same element object makes React skip the update
  const ui = () => (
    <SettingsProvider initialSettings={initialSettings}>
      <Sidebar />
      <SettingsSpy />
    </SettingsProvider>
  )
  const result = render(ui())
  return { ...result, rerender: () => result.rerender(ui()) }
}

beforeEach(() => {
  mockApi({
    readDir: vi.fn(async (path) => tree[path] ?? { error: "ENOENT" }),
    saveSettings: vi.fn(async () => ({ success: true }))
  })
})

// Each folder row has the chevron (toggle) and a button (navigate)
const row = (name) => screen.getByRole("button", { name }).closest(".fl-folder-content")
const toggle = (name) => fireEvent.click(row(name).querySelector(".lucide-chevron-right"))

describe("places", () => {
  it("navigates to the resolved folder", async () => {
    setup()
    await waitFor(() => expect(window.api.getPath).toHaveBeenCalledWith("downloads"))
    fireEvent.click(screen.getByText("Downloads"))
    await waitFor(() => expect(tabs.navigate).toHaveBeenCalledWith("1", "/home/user/downloads"))
  })

  it("does nothing for a place that failed to resolve", async () => {
    window.api.getPath.mockImplementation(async (name) =>
      name === "pictures" ? { error: "EINVAL" } : { path: `/home/user/${name}` }
    )
    setup()
    await waitFor(() => expect(window.api.getPath).toHaveBeenCalledTimes(4))
    fireEvent.click(screen.getByText("Pictures"))
    expect(tabs.navigate).not.toHaveBeenCalled()
  })
})

describe("folder tree", () => {
  it("starts with a collapsed root", () => {
    setup()
    expect(screen.getByRole("button", { name: "/" })).toBeTruthy()
    expect(window.api.readDir).not.toHaveBeenCalled()
  })

  it("expanding shows only visible subfolders", async () => {
    setup()
    toggle("/")
    expect(await screen.findByRole("button", { name: "home" })).toBeTruthy()
    expect(screen.queryByRole("button", { name: ".config" })).toBeNull()
    expect(screen.queryByRole("button", { name: "a.txt" })).toBeNull()
  })

  it("shows dot folders when enabled", async () => {
    setup({ showDotFiles: true })
    toggle("/")
    expect(await screen.findByRole("button", { name: ".config" })).toBeTruthy()
  })

  it("expands nested folders with full paths", async () => {
    setup()
    toggle("/")
    await screen.findByRole("button", { name: "home" })
    toggle("home")
    fireEvent.click(await screen.findByRole("button", { name: "user" }))
    expect(tabs.navigate).toHaveBeenCalledWith("1", "/home/user")
  })

  it("collapsing hides children", async () => {
    setup()
    toggle("/")
    await screen.findByRole("button", { name: "home" })
    toggle("/")
    expect(screen.queryByRole("button", { name: "home" })).toBeNull()
  })

  it("clicking a folder name navigates without expanding", () => {
    setup()
    fireEvent.click(screen.getByRole("button", { name: "/" }))
    expect(tabs.navigate).toHaveBeenCalledWith("1", "/")
    expect(window.api.readDir).not.toHaveBeenCalled()
  })

  it("reloads open folders when treeVersion changes", async () => {
    const { rerender } = setup()
    toggle("/")
    await screen.findByRole("button", { name: "home" })
    expect(window.api.readDir).toHaveBeenCalledTimes(1)

    tree["/"] = [...tree["/"], dir("srv")]
    tabs = { ...tabs, treeVersion: 1 }
    rerender()
    expect(await screen.findByRole("button", { name: "srv" })).toBeTruthy()
    tree["/"] = tree["/"].filter((f) => f.name !== "srv")
  })
})

describe("resizing", () => {
  it("dragging the handle changes sidebarWidth", () => {
    const { container } = setup()
    fireEvent.mouseDown(container.querySelector(".sidebar-resize-handle"), { clientX: 200 })
    fireEvent.mouseMove(window, { clientX: 260 })
    act(() => fireEvent.mouseUp(window))
    expect(settings.sidebarWidth).toBe(260)
    expect(container.querySelector(".sidebar").style.width).toBe("260px")
  })
})

describe("drives", () => {
  const drives = [
    { target: "/", source: "/dev/nvme0n1p2", label: null },
    { target: "/mnt/daten", source: "/dev/nvme1n1p4", label: "Daten" }
  ]

  it("lists drives by label, falling back to the mount point", async () => {
    window.api.listDrives.mockResolvedValueOnce(drives)
    const { container } = setup()
    await waitFor(() => expect(container.querySelectorAll(".drive")).toHaveLength(2))
    expect([...container.querySelectorAll(".drive p")].map((p) => p.textContent)).toEqual([
      "/",
      "Daten"
    ])
  })

  it("navigates to the mount point", async () => {
    window.api.listDrives.mockResolvedValueOnce(drives)
    setup()
    fireEvent.click(await screen.findByText("Daten"))
    expect(tabs.navigate).toHaveBeenCalledWith("1", "/mnt/daten")
  })

  // Every call runs findmnt in the main process
  it("lists drives only once, not on every render", async () => {
    window.api.listDrives.mockResolvedValue(drives)
    const { rerender } = setup()
    await screen.findByText("Daten")
    rerender()
    await new Promise((r) => setTimeout(r, 20))
    expect(window.api.listDrives).toHaveBeenCalledTimes(1)
  })

  it("shows no drives when listing fails", async () => {
    window.api.listDrives.mockResolvedValueOnce({ error: "ENOENT" })
    const { container } = setup()
    await waitFor(() => expect(window.api.listDrives).toHaveBeenCalled())
    expect(container.querySelectorAll(".drive")).toHaveLength(0)
  })
})
