import { describe, expect, it } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { SettingsProvider, useSettings } from "../src/renderer/src/hooks/useSettings.jsx"
import { UIProvider, useUI } from "../src/renderer/src/hooks/useUI.jsx"

describe("useSettings", () => {
  it("has defaults and updates values", () => {
    const { result } = renderHook(useSettings, { wrapper: SettingsProvider })
    expect(result.current).toMatchObject({
      showDotFiles: false,
      foldersOnTop: true,
      dragDeadzone: 20,
      sortingMode: { key: "name", desc: false }
    })

    act(() => result.current.setShowDotFiles(true))
    act(() => result.current.setSortingMode({ key: "size", desc: true }))
    expect(result.current.showDotFiles).toBe(true)
    expect(result.current.sortingMode).toEqual({ key: "size", desc: true })
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
