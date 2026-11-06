import { afterEach, describe, expect, it, vi } from "vitest"
import {
  answerConfirmation,
  confirm,
  getConfirmation,
  subscribe
} from "../src/renderer/src/utils/confirmation.js"

// The store is module-level state, so make sure no test leaves a dialog open
afterEach(() => answerConfirmation(false))

describe("confirm", () => {
  it("exposes the dialog with default texts", () => {
    confirm("Delete 1 item(s)?")
    expect(getConfirmation()).toMatchObject({
      title: "Are you sure?",
      message: "Delete 1 item(s)?",
      confirmText: "Yes",
      cancelText: "Cancel"
    })
  })

  it("accepts custom texts", () => {
    confirm("msg", { title: "T", confirmText: "Delete", cancelText: "Keep" })
    expect(getConfirmation()).toMatchObject({ title: "T", confirmText: "Delete", cancelText: "Keep" })
  })

  it.each([true, false])("resolves with the answer %s and closes", async (answer) => {
    const promise = confirm("msg")
    answerConfirmation(answer)
    await expect(promise).resolves.toBe(answer)
    expect(getConfirmation()).toBeNull()
  })

  it("cancels the previous dialog when a new one opens", async () => {
    const first = confirm("first")
    const second = confirm("second")
    await expect(first).resolves.toBe(false)
    expect(getConfirmation().message).toBe("second")

    answerConfirmation(true)
    await expect(second).resolves.toBe(true)
  })

  it("ignores answers when nothing is open", () => {
    expect(() => answerConfirmation(true)).not.toThrow()
    expect(getConfirmation()).toBeNull()
  })
})

describe("subscribe", () => {
  it("notifies on open and on answer, until unsubscribed", () => {
    const listener = vi.fn()
    const unsubscribe = subscribe(listener)

    confirm("msg")
    expect(listener).toHaveBeenCalledTimes(1)
    answerConfirmation(true)
    expect(listener).toHaveBeenCalledTimes(2)

    unsubscribe()
    confirm("again")
    expect(listener).toHaveBeenCalledTimes(2)
  })

  // useSyncExternalStore re-renders forever if the snapshot changes on every read
  it("returns the same snapshot until something changes", () => {
    confirm("msg")
    expect(getConfirmation()).toBe(getConfirmation())
  })
})
