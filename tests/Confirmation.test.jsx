import { afterEach, describe, expect, it } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"
import Confirmation from "../src/renderer/src/components/Confirmation.jsx"
import { answerConfirmation, confirm } from "../src/renderer/src/utils/confirmation.js"

afterEach(() => act(() => answerConfirmation(false)))

describe("Confirmation", () => {
  it("renders nothing without an open dialog", () => {
    const { container } = render(<Confirmation />)
    expect(container.innerHTML).toBe("")
  })

  it("shows the dialog when confirm is called", () => {
    render(<Confirmation />)
    act(() => {
      confirm("Delete 3 item(s)?", { title: "Delete", confirmText: "Delete", cancelText: "Keep" })
    })
    expect(screen.getByText("Delete 3 item(s)?")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Keep" })).toBeTruthy()
    expect(screen.getAllByText("Delete")).toHaveLength(2) // title + button
  })

  it.each([
    ["Yes", true],
    ["Cancel", false]
  ])("clicking %s resolves with %s and closes", async (label, answer) => {
    const { container } = render(<Confirmation />)
    let promise
    act(() => {
      promise = confirm("Sure?")
    })

    fireEvent.click(screen.getByRole("button", { name: label }))
    await expect(promise).resolves.toBe(answer)
    expect(container.innerHTML).toBe("")
  })
})
