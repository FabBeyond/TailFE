import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { errorMessage, getToasts, showToast, subscribe } from "../src/renderer/src/utils/toast.js"

describe("errorMessage", () => {
  it("maps known codes", () => {
    expect(errorMessage("EACCES")).toBe("Permission denied")
    expect(errorMessage("EPERM")).toBe("Operation not permitted")
  })

  it("falls back to the code, then to a generic message", () => {
    expect(errorMessage("ESOMETHING")).toBe("ESOMETHING")
    expect(errorMessage(undefined)).toBe("Unknown error")
  })
})

describe("showToast", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it("adds a toast, notifies listeners and removes it after the duration", () => {
    const listener = vi.fn()
    const unsubscribe = subscribe(listener)

    showToast("Title", "Message", "error", 1000)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(getToasts().at(-1)).toMatchObject({ title: "Title", message: "Message", type: "error" })

    const count = getToasts().length
    vi.advanceTimersByTime(1000)
    expect(listener).toHaveBeenCalledTimes(2)
    expect(getToasts()).toHaveLength(count - 1)

    unsubscribe()
  })

  it("defaults to type info", () => {
    showToast("Hi", "there")
    expect(getToasts().at(-1).type).toBe("info")
    vi.runAllTimers()
  })

  it("stops notifying after unsubscribe", () => {
    const listener = vi.fn()
    subscribe(listener)()
    showToast("x", "y", "info", 10)
    vi.runAllTimers()
    expect(listener).not.toHaveBeenCalled()
  })
})
