import { beforeEach, describe, expect, it, vi } from "vitest"
import { dir, file, mockApi } from "./helpers.js"
import { handleKeybinds } from "../src/renderer/src/utils/keybinds.js"

let api
beforeEach(() => {
  api = mockApi()
})

function press(key, states = {}, event = {}) {
  handleKeybinds(
    { key, target: document.body, preventDefault: vi.fn(), ...event },
    { insertMode: false, activeTab: "1", selectedFiles: [], ...states }
  )
}

describe("Enter in normal mode", () => {
  it("does nothing with no selection", () => {
    const navigate = vi.fn()
    press("Enter", { navigate, getSelectedEntry: () => undefined })
    expect(navigate).not.toHaveBeenCalled()
    expect(api.openFile).not.toHaveBeenCalled()
  })

  it("navigates into a selected folder", () => {
    const navigate = vi.fn()
    press("Enter", {
      navigate,
      selectedFiles: ["/home/docs"],
      getSelectedEntry: () => dir("docs")
    })
    expect(navigate).toHaveBeenCalledWith("1", "/home/docs")
    expect(api.openFile).not.toHaveBeenCalled()
  })

  it("opens a selected file", async () => {
    const navigate = vi.fn()
    press("Enter", {
      navigate,
      selectedFiles: ["/home/a.txt"],
      getSelectedEntry: () => file("a.txt")
    })
    await vi.waitFor(() => expect(api.openFile).toHaveBeenCalledWith("/home/a.txt"))
    expect(navigate).not.toHaveBeenCalled()
  })
})

describe("zoom keys", () => {
  it.each([
    [".", 22],
    [",", 18]
  ])("%s changes mainZoom", (key, expected) => {
    const updateSetting = vi.fn()
    press(key, { updateSetting })

    expect(updateSetting).toHaveBeenCalledTimes(1)
    const [name, updater] = updateSetting.mock.calls[0]
    expect(name).toBe("mainZoom")
    expect(updater(20)).toBe(expected)
  })
})

describe("ignored keypresses", () => {
  it.each(["INPUT", "TEXTAREA"])("ignores keys typed into a %s", (tagName) => {
    const updateSetting = vi.fn()
    press(".", { updateSetting }, { target: { tagName } })
    expect(updateSetting).not.toHaveBeenCalled()
  })

  it.each(["ctrlKey", "altKey", "metaKey"])("ignores keys held with %s", (modifier) => {
    const updateSetting = vi.fn()
    press(".", { updateSetting }, { [modifier]: true })
    expect(updateSetting).not.toHaveBeenCalled()
  })
})
