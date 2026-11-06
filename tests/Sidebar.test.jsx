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
  const ui = (
    <SettingsProvider initialSettings={initialSettings}>
      <Sidebar />
      <SettingsSpy />
    </SettingsProvider>
  )
  const result = render(ui)
  return { ...result, rerender: () => result.rerender(ui) }
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
