import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import TopBar from "../src/renderer/src/components/TopBar.jsx"

let ui, tabs
vi.mock("../src/renderer/src/hooks/useUI.jsx", () => ({ useUI: () => ui }))
vi.mock("../src/renderer/src/hooks/useTabs.jsx", () => ({ useTabs: () => tabs }))

function setup(path = "/home/user", { history = {}, ...uiOverrides } = {}) {
  ui = {
    insertMode: false,
    pathWriting: false,
    setPathWriting: vi.fn(),
    setSettingsOpen: vi.fn(),
    ...uiOverrides
  }
  tabs = {
    activeTab: "1",
    getPath: () => path,
    navigate: vi.fn(async () => true),
    moveInHistory: vi.fn(),
    canMoveHistory: () => ({ backwards: false, forwards: false, ...history })
  }
  return render(<TopBar />)
}

// lucide icons render as <svg class="lucide lucide-<name> ...">
const icon = (container, name) => container.querySelector(`.lucide-${name}`)

beforeEach(() => vi.clearAllMocks())

describe("breadcrumbs", () => {
  it("shows one button per path segment", () => {
    setup("/home/user/docs")
    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual(["home", "user", "docs"])
  })

  it("navigates to the clicked segment without opening the address input", () => {
    setup("/home/user/docs")
    fireEvent.click(screen.getByRole("button", { name: "user" }))
    expect(tabs.navigate).toHaveBeenCalledWith("1", "/home/user")
    expect(ui.setPathWriting).not.toHaveBeenCalled()
  })

  it("shows just a slash at the root", () => {
    const { container } = setup("/")
    expect(screen.queryAllByRole("button")).toHaveLength(0)
    expect(container.querySelectorAll(".slash-separator")).toHaveLength(1)
  })

  it("clicking the bar switches to the text input", () => {
    const { container } = setup()
    fireEvent.click(container.querySelector(".address-bar"))
    expect(ui.setPathWriting).toHaveBeenCalledWith(true)
  })
})

describe("address input", () => {
  const input = () => screen.getByRole("textbox")

  it("starts with the current path", () => {
    setup("/home/user", { pathWriting: true })
    expect(input().value).toBe("/home/user")
  })

  it("Enter navigates to the typed path and blurs", async () => {
    setup("/home/user", { pathWriting: true })
    fireEvent.change(input(), { target: { value: "/etc" } })
    fireEvent.keyUp(input(), { key: "Enter" })
    expect(tabs.navigate).toHaveBeenCalledWith("1", "/etc")
    await waitFor(() => expect(ui.setPathWriting).toHaveBeenCalledWith(false))
  })

  // Intentional: the input closes even if navigate fails (it shows its own toast)
  it("closes even when navigation fails", async () => {
    setup("/home/user", { pathWriting: true })
    tabs.navigate.mockResolvedValueOnce(false)
    fireEvent.change(input(), { target: { value: "/nope" } })
    fireEvent.keyUp(input(), { key: "Enter" })
    await waitFor(() => expect(ui.setPathWriting).toHaveBeenCalledWith(false))
  })

  it("Escape closes without navigating", () => {
    setup("/home/user", { pathWriting: true })
    fireEvent.change(input(), { target: { value: "/etc" } })
    fireEvent.keyUp(input(), { key: "Escape" })
    expect(tabs.navigate).not.toHaveBeenCalled()
    expect(ui.setPathWriting).toHaveBeenCalledWith(false)
  })

  it("blur closes the input", () => {
    setup("/home/user", { pathWriting: true })
    fireEvent.blur(input())
    expect(ui.setPathWriting).toHaveBeenCalledWith(false)
  })
})

describe("navigation buttons", () => {
  it("back and forward move through history", () => {
    const { container } = setup("/home/user", { history: { backwards: true, forwards: true } })
    fireEvent.click(icon(container, "chevron-left"))
    fireEvent.click(icon(container, "chevron-right"))
    expect(tabs.moveInHistory.mock.calls).toEqual([
      ["1", -1],
      ["1", 1]
    ])
  })

  it("greys out history buttons that can't be used", () => {
    const { container } = setup("/home/user", { history: { backwards: true, forwards: false } })
    expect(icon(container, "chevron-left").classList.contains("disabled")).toBe(false)
    expect(icon(container, "chevron-right").classList.contains("disabled")).toBe(true)
  })

  it("up goes to the parent folder", () => {
    const { container } = setup("/home/user")
    fireEvent.click(icon(container, "arrow-up"))
    expect(tabs.navigate).toHaveBeenCalledWith("1", "/home")
  })

  it("up is disabled at the root", () => {
    const { container } = setup("/")
    expect(icon(container, "arrow-up").classList.contains("disabled")).toBe(true)
  })
})

describe("other controls", () => {
  it.each([
    [false, "NORMAL"],
    [true, "INSERT"]
  ])("mode indicator with insertMode=%s shows %s", (insertMode, label) => {
    setup("/home/user", { insertMode })
    expect(screen.getByText(label)).toBeTruthy()
  })

  it("the settings icon opens settings", () => {
    const { container } = setup()
    fireEvent.click(icon(container, "settings"))
    expect(ui.setSettingsOpen).toHaveBeenCalledWith(true)
  })
})
