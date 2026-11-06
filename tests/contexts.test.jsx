import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { SettingsProvider, useSettings } from "../src/renderer/src/hooks/useSettings.jsx"
import { UIProvider, useUI } from "../src/renderer/src/hooks/useUI.jsx"
import { mockApi } from "./helpers.js"

describe("useSettings", () => {
  it("has defaults and updates values", () => {
    const { result } = renderHook(useSettings, { wrapper: SettingsProvider })
    expect(result.current).toMatchObject({
      showDotFiles: false,
      foldersOnTop: true,
      dragDeadzone: 20,
      sortingMode: { key: "name", desc: false }
    })

    act(() => result.current.updateSetting("showDotFiles", true))
    act(() => result.current.updateSetting("sortingMode", { key: "size", desc: true }))
    expect(result.current.showDotFiles).toBe(true)
    expect(result.current.sortingMode).toEqual({ key: "size", desc: true })
  })

  it("accepts an updater function", () => {
    const { result } = renderHook(useSettings, { wrapper: SettingsProvider })
    const start = result.current.mainZoom

    act(() => result.current.updateSetting("mainZoom", (prev) => prev + 2))
    expect(result.current.mainZoom).toBe(start + 2)
  })

  it("keeps the same value object when nothing changed", () => {
    const { result, rerender } = renderHook(useSettings, { wrapper: SettingsProvider })
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })
})

describe("useUI", () => {
  it("has defaults and updates values", () => {
    const { result } = renderHook(useUI, { wrapper: UIProvider })
    expect(result.current).toMatchObject({
      menu: null,
      renaming: false,
      insertMode: false,
      kbdSearchLet: ""
    })

    act(() => result.current.setMenu({ type: "file", target: "/a", x: 1, y: 2 }))
    act(() => result.current.setInsertMode(true))
    expect(result.current.menu).toMatchObject({ target: "/a" })
    expect(result.current.insertMode).toBe(true)
  })
})

describe("useSettings initialSettings", () => {
  const withInitial = (initialSettings) =>
    function Wrapper({ children }) {
      return <SettingsProvider initialSettings={initialSettings}>{children}</SettingsProvider>
    }

  it("overrides defaults with saved values", () => {
    const { result } = renderHook(useSettings, {
      wrapper: withInitial({ showDotFiles: true, sidebarWidth: 321 })
    })
    expect(result.current.showDotFiles).toBe(true)
    expect(result.current.sidebarWidth).toBe(321)
    expect(result.current.foldersOnTop).toBe(true)
  })

  it("merges nested objects instead of replacing them", () => {
    const { result } = renderHook(useSettings, {
      wrapper: withInitial({ columnWidths: { nameCol: 500 }, sortingMode: { desc: true } })
    })
    expect(result.current.columnWidths).toEqual({ nameCol: 500, sizeCol: 150 })
    expect(result.current.sortingMode).toEqual({ key: "name", desc: true })
  })

  it("exposes the defaults untouched", () => {
    const { result } = renderHook(useSettings, { wrapper: withInitial({ mainZoom: 40 }) })
    expect(result.current.mainZoom).toBe(40)
    expect(result.current.DEFAULT_SETTINGS.mainZoom).toBe(20)
  })
})

describe("useSettings saving", () => {
  let api
  beforeEach(() => {
    vi.useFakeTimers()
    api = mockApi({ saveSettings: vi.fn(async () => ({ success: true })) })
  })
  afterEach(() => vi.useRealTimers())

  it("does not save on mount", () => {
    renderHook(useSettings, { wrapper: SettingsProvider })
    act(() => vi.advanceTimersByTime(1000))
    expect(api.saveSettings).not.toHaveBeenCalled()
  })

  it("saves 300ms after a change", () => {
    const { result } = renderHook(useSettings, { wrapper: SettingsProvider })
    act(() => result.current.updateSetting("showDotFiles", true))

    act(() => vi.advanceTimersByTime(299))
    expect(api.saveSettings).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(api.saveSettings).toHaveBeenCalledTimes(1)
    expect(api.saveSettings.mock.calls[0][0]).toMatchObject({ showDotFiles: true })
  })

  it("debounces rapid changes into one save with the latest values", () => {
    const { result } = renderHook(useSettings, { wrapper: SettingsProvider })
    for (let i = 0; i < 5; i++) {
      act(() => result.current.updateSetting("mainZoom", (z) => z + 1))
      act(() => vi.advanceTimersByTime(100))
    }
    act(() => vi.advanceTimersByTime(300))
    expect(api.saveSettings).toHaveBeenCalledTimes(1)
    expect(api.saveSettings.mock.calls[0][0].mainZoom).toBe(25)
  })

  it("saves only settings, not the context helpers", () => {
    const { result } = renderHook(useSettings, { wrapper: SettingsProvider })
    act(() => result.current.updateSetting("showDotFiles", true))
    act(() => vi.advanceTimersByTime(300))
    const saved = api.saveSettings.mock.calls[0][0]
    expect(saved).not.toHaveProperty("updateSetting")
    expect(saved).not.toHaveProperty("DEFAULT_SETTINGS")
  })

  // The window closing would never wait out the 300ms timer
  it("saves immediately on pagehide", () => {
    const { result } = renderHook(useSettings, { wrapper: SettingsProvider })
    act(() => result.current.updateSetting("showDotFiles", true))

    act(() => window.dispatchEvent(new Event("pagehide")))
    expect(api.saveSettings).toHaveBeenCalledTimes(1)
    expect(api.saveSettings.mock.calls[0][0]).toMatchObject({ showDotFiles: true })
  })

  it("does not save again when nothing changed after a save", () => {
    const { result, rerender } = renderHook(useSettings, { wrapper: SettingsProvider })
    act(() => result.current.updateSetting("showDotFiles", true))
    act(() => vi.advanceTimersByTime(300))
    rerender()
    act(() => vi.advanceTimersByTime(1000))
    expect(api.saveSettings).toHaveBeenCalledTimes(1)
  })
})

describe("useUI setters", () => {
  it.each([
    ["setRenaming", "renaming", true],
    ["setPropertiesShown", "propertiesShown", true],
    ["setPathWriting", "pathWriting", true],
    ["setKdbSearchLet", "kbdSearchLet", "ab"],
    ["setSettingsOpen", "settingsOpen", true]
  ])("%s updates %s", (setter, key, value) => {
    const { result } = renderHook(useUI, { wrapper: UIProvider })
    act(() => result.current[setter](value))
    expect(result.current[key]).toBe(value)
  })
})
