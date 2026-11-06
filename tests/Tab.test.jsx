import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { dir, file } from "./helpers.js"
import { SettingsProvider, useSettings } from "../src/renderer/src/hooks/useSettings.jsx"
import { UIProvider } from "../src/renderer/src/hooks/useUI.jsx"
import Tab from "../src/renderer/src/components/Tab.jsx"

let tabs
vi.mock("../src/renderer/src/hooks/useTabs.jsx", () => ({ useTabs: () => tabs }))

let settings
function SettingsSpy() {
  settings = useSettings()
  return null
}

function setup(files, initialSettings) {
  tabs = {
    activeTab: "1",
    getFiles: () => files,
    getPath: () => "/home/user",
    selectedFiles: [],
    setSelectedFiles: vi.fn(),
    refresh: vi.fn(),
    navigate: vi.fn()
  }
  return render(
    <SettingsProvider initialSettings={initialSettings}>
      <UIProvider>
        <Tab />
        <SettingsSpy />
      </UIProvider>
    </SettingsProvider>
  )
}

const shownNames = (container) =>
  [...container.querySelectorAll(".file .file-name p")].map((p) => p.textContent)

const files = [file("b.txt", 300), dir("zeta"), file(".hidden"), file("a10.txt", 100), file("a2.txt", 200)]

// Sorting and resizing change settings, which SettingsProvider saves after a delay
beforeEach(() => {
  window.api.saveSettings = vi.fn(async () => ({ success: true }))
})

describe("file list", () => {
  it("sorts by name with folders on top and hides dot files by default", () => {
    const { container } = setup(files)
    expect(shownNames(container)).toEqual(["zeta", "a2.txt", "a10.txt", "b.txt"])
  })

  it("shows dot files when enabled", () => {
    const { container } = setup(files, { showDotFiles: true })
    expect(shownNames(container)).toContain(".hidden")
  })

  it("mixes folders in when foldersOnTop is off", () => {
    const { container } = setup(files, { foldersOnTop: false })
    expect(shownNames(container)).toEqual(["a2.txt", "a10.txt", "b.txt", "zeta"])
  })

  it("builds full paths from the tab path", () => {
    const { container } = setup([file("a.txt")])
    expect(container.querySelector(".file").dataset.id).toBe("/home/user/a.txt")
  })
})

describe("headers", () => {
  it("renders all columns", () => {
    setup(files)
    for (const label of ["Name", "Size", "Last Modified"]) expect(screen.getByText(label)).toBeTruthy()
  })

  it("clicking another column sorts by it ascending", () => {
    const { container } = setup(files)
    fireEvent.click(screen.getByText("Size"))
    expect(settings.sortingMode).toEqual({ key: "size", desc: false })
    expect(shownNames(container)).toEqual(["zeta", "a10.txt", "a2.txt", "b.txt"])
  })

  it("clicking the active column toggles the direction", () => {
    setup(files)
    fireEvent.click(screen.getByText("Name"))
    expect(settings.sortingMode).toEqual({ key: "name", desc: true })
    fireEvent.click(screen.getByText("Name"))
    expect(settings.sortingMode).toEqual({ key: "name", desc: false })
  })

  it("shows the sort arrow only on the active column", () => {
    const { container } = setup(files)
    const headers = [...container.querySelectorAll(".file-header")]
    expect(headers.map((h) => !!h.querySelector("svg"))).toEqual([true, false, false])
  })

  it("has resize handles only for sized columns", () => {
    const { container } = setup(files)
    expect(container.querySelectorAll(".files-headers .resize-handle")).toHaveLength(2)
  })

  it("dragging a handle resizes that column", () => {
    const { container } = setup(files)
    const handle = container.querySelector(".files-headers .resize-handle")
    fireEvent.mouseDown(handle, { clientX: 100 })
    fireEvent.mouseMove(window, { clientX: 150 })
    fireEvent.mouseUp(window)
    expect(settings.columnWidths).toEqual({ nameCol: 350, sizeCol: 150 })
  })
})
