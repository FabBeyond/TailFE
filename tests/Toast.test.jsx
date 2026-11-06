import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, render, screen } from "@testing-library/react"
import Toast from "../src/renderer/src/components/Toast.jsx"
import { showToast } from "../src/renderer/src/utils/toast.js"

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  act(() => vi.runAllTimers())
  vi.useRealTimers()
})

describe("Toast", () => {
  it("renders an empty container when there are no toasts", () => {
    const { container } = render(<Toast />)
    expect(container.querySelector(".toasts-container").children).toHaveLength(0)
  })

  it("shows new toasts with title, message and type class", () => {
    const { container } = render(<Toast />)
    act(() => showToast("Couldn't delete", "Permission denied", "error"))

    expect(screen.getByText("Couldn't delete")).toBeTruthy()
    expect(screen.getByText("Permission denied")).toBeTruthy()
    expect(container.querySelector(".toast.error")).toBeTruthy()
  })

  it.each(["info", "warning", "error"])("renders an icon for %s", (type) => {
    const { container } = render(<Toast />)
    act(() => showToast("t", "m", type))
    expect(container.querySelector(`.toast.${type} svg.icon`)).toBeTruthy()
  })

  it("stacks several toasts and removes them when they expire", () => {
    const { container } = render(<Toast />)
    act(() => {
      showToast("first", "a", "info", 1000)
      showToast("second", "b", "info", 2000)
    })
    expect(container.querySelectorAll(".toast")).toHaveLength(2)

    act(() => vi.advanceTimersByTime(1000))
    expect(screen.queryByText("first")).toBeNull()
    expect(screen.getByText("second")).toBeTruthy()

    act(() => vi.advanceTimersByTime(1000))
    expect(container.querySelectorAll(".toast")).toHaveLength(0)
  })
})
