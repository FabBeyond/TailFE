import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { dir, file } from "./helpers.js"
import { openFile, rename } from "../src/renderer/src/utils/fileActions.js"
import { SettingsProvider } from "../src/renderer/src/hooks/useSettings.jsx"
import File from "../src/renderer/src/components/File.jsx"

let ui, tabs
vi.mock("../src/renderer/src/hooks/useUI.jsx", () => ({ useUI: () => ui }))
vi.mock("../src/renderer/src/hooks/useTabs.jsx", () => ({ useTabs: () => tabs }))
vi.mock("../src/renderer/src/utils/fileActions.js", () => ({
  openFile: vi.fn(async () => {}),
  rename: vi.fn(async () => true)
}))

function setup(entry, { selected = [], ...uiOverrides } = {}) {
  ui = { renaming: false, setRenaming: vi.fn(), insertMode: false, kbdSearchLet: "", ...uiOverrides }
  tabs = {
    selectedFiles: selected,
    setSelectedFiles: vi.fn(),
    refresh: vi.fn(),
    navigate: vi.fn()
  }
  return render(
    <SettingsProvider>
      <File file={entry} tabId="1" tabPath="/home/user" />
    </SettingsProvider>
  )
}

beforeEach(() => vi.clearAllMocks())

describe("rendering", () => {
  it("shows name and readable size for files", () => {
    setup(file("notes.md", 1500))
    expect(screen.getByText("notes.md")).toBeTruthy()
    expect(screen.getByText("1.5 KB")).toBeTruthy()
  })

  it("hides the size for folders", () => {
    const { container } = setup(dir("docs"))
    expect(container.querySelector(".file-size").textContent).toBe("")
  })

  // read-dir returns null size and date for broken symlinks
  it("renders entries with no size or date", () => {
    const { container } = setup({ name: "link", isDirectory: false, size: null, lastModified: null })
    expect(container.querySelector(".file-size").textContent).toBe("")
    expect(container.querySelector(".file-last-modified").textContent).toBe("")
  })

  it("shows a relative modified time", () => {
    const { container } = setup({ ...file("a"), lastModified: new Date() })
    expect(container.querySelector(".file-last-modified").textContent).toMatch(/now|second/)
  })

  it("exposes data attributes for the context menu and drag", () => {
    const { container } = setup(dir("docs"))
    const el = container.querySelector(".file")
    expect(el.dataset).toMatchObject({ context: "file", id: "/home/user/docs", isDirectory: "true" })
  })

  it("marks the entry as selected", () => {
    const { container } = setup(file("a.txt"), { selected: ["/home/user/a.txt"] })
    expect(container.querySelector(".file").classList.contains("selected")).toBe(true)
  })
})

describe("clicking", () => {
  it("click selects only this entry", () => {
    setup(file("a.txt"))
    fireEvent.click(screen.getByText("a.txt"))
    expect(tabs.setSelectedFiles).toHaveBeenCalledWith(["/home/user/a.txt"])
  })

  it("double-click navigates into folders", () => {
    setup(dir("docs"))
    fireEvent.doubleClick(screen.getByText("docs"))
    expect(tabs.navigate).toHaveBeenCalledWith("1", "/home/user/docs")
    expect(openFile).not.toHaveBeenCalled()
  })

  it("double-click opens files", () => {
    setup(file("a.txt"))
    fireEvent.doubleClick(screen.getByText("a.txt"))
    expect(openFile).toHaveBeenCalledWith("/home/user/a.txt")
    expect(tabs.navigate).not.toHaveBeenCalled()
  })
})

describe("insert mode highlighting", () => {
  it("highlights the typed prefix", () => {
    const { container } = setup(file("notes.md"), { insertMode: true, kbdSearchLet: "no" })
    expect(container.querySelector(".insert-typed").textContent).toBe("no")
  })

  it("does not highlight non-matching names", () => {
    const { container } = setup(file("notes.md"), { insertMode: true, kbdSearchLet: "x" })
    expect(container.querySelector(".insert-typed")).toBeNull()
  })

  it("does not highlight outside insert mode", () => {
    const { container } = setup(file("notes.md"), { insertMode: false, kbdSearchLet: "no" })
    expect(container.querySelector(".insert-typed")).toBeNull()
  })
})

describe("renaming", () => {
  const renaming = { renaming: true, selected: ["/home/user/a.txt"] }
  const input = () => screen.getByRole("textbox")

  it("shows an input with the current name for the single selected file", () => {
    setup(file("a.txt"), renaming)
    expect(input().value).toBe("a.txt")
  })

  it("does not show an input for a multi-selection", () => {
    setup(file("a.txt"), { renaming: true, selected: ["/home/user/a.txt", "/home/user/b"] })
    expect(screen.queryByRole("textbox")).toBeNull()
  })

  it("does not show an input on other entries", () => {
    setup(file("b.txt"), renaming)
    expect(screen.queryByRole("textbox")).toBeNull()
  })

  it("Enter renames, ends renaming and selects the new path", async () => {
    setup(file("a.txt"), renaming)
    fireEvent.change(input(), { target: { value: "b.txt" } })
    fireEvent.keyDown(input(), { key: "Enter" })

    await waitFor(() => expect(ui.setRenaming).toHaveBeenCalledWith(false))
    expect(rename).toHaveBeenCalledWith("/home/user/a.txt", "/home/user/b.txt", tabs.refresh)
    expect(tabs.setSelectedFiles).toHaveBeenCalledWith(["/home/user/b.txt"])
  })

  it("keeps the selection when the rename fails", async () => {
    vi.mocked(rename).mockResolvedValueOnce(false)
    setup(file("a.txt"), renaming)
    fireEvent.change(input(), { target: { value: "b.txt" } })
    fireEvent.keyDown(input(), { key: "Enter" })

    await waitFor(() => expect(ui.setRenaming).toHaveBeenCalledWith(false))
    expect(tabs.setSelectedFiles).not.toHaveBeenCalled()
  })

  it.each([
    ["unchanged", "a.txt"],
    ["empty", ""]
  ])("Enter with an %s name does not rename", async (_, value) => {
    setup(file("a.txt"), renaming)
    fireEvent.change(input(), { target: { value } })
    fireEvent.keyDown(input(), { key: "Enter" })

    await waitFor(() => expect(ui.setRenaming).toHaveBeenCalledWith(false))
    expect(rename).not.toHaveBeenCalled()
  })

  it("Escape cancels", () => {
    setup(file("a.txt"), renaming)
    fireEvent.keyDown(input(), { key: "Escape" })
    expect(ui.setRenaming).toHaveBeenCalledWith(false)
    expect(rename).not.toHaveBeenCalled()
  })

  it("blur cancels", () => {
    setup(file("a.txt"), renaming)
    fireEvent.blur(input())
    expect(ui.setRenaming).toHaveBeenCalledWith(false)
  })

  it("double-clicking the input does not open the file", () => {
    setup(file("a.txt"), renaming)
    fireEvent.doubleClick(input())
    expect(openFile).not.toHaveBeenCalled()
  })
})
