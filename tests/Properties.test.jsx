import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { file, mockApi } from "./helpers.js"
import Properties from "../src/renderer/src/components/Properties.jsx"

let tabs
vi.mock("../src/renderer/src/hooks/useTabs.jsx", () => ({ useTabs: () => tabs }))
vi.mock("../src/renderer/src/hooks/useUI.jsx", () => ({
  useUI: () => ({ propertiesShown: true, setPropertiesShown: vi.fn() })
}))

function renderFor(entry, path) {
  tabs = { activeTab: "1", selectedFiles: [path], getSelectedEntry: () => entry }
  return render(<Properties />)
}

beforeEach(() => {
  // readDir fails on anything that isn't a folder, so Contents shows "Unknown"
  mockApi({ readDir: vi.fn(async () => ({ error: "ENOTDIR" })) })
})

describe("Properties", () => {
  // read-dir returns null size and date when stat fails, e.g. for a broken symlink
  it("renders an entry with no size or date", async () => {
    const brokenLink = { name: "link", isDirectory: false, size: null, lastModified: null }
    renderFor(brokenLink, "/home/link")

    expect(screen.getByText("Last Modified")).toBeTruthy()
    expect(await screen.findByText("Unknown")).toBeTruthy()
  })

  describe("copy button", () => {
    const realClipboard = navigator.clipboard
    let writeText

    beforeEach(() => {
      writeText = vi.fn(async () => {})
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText },
        configurable: true
      })
    })
    afterEach(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: realClipboard,
        configurable: true
      })
    })

    it("writes the path to the clipboard", async () => {
      const { container } = renderFor(file("a.txt"), "/home/a.txt")
      await screen.findByText("Unknown")

      fireEvent.click(container.querySelector(".property-copy-button"))

      await waitFor(() => expect(writeText).toHaveBeenCalledWith("/home/a.txt"))
    })
  })
})
