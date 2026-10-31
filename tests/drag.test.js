import { beforeEach, describe, expect, it, vi } from "vitest"
import { importForPlatform } from "./helpers.js"
import { moveFiles } from "../src/renderer/src/utils/fileActions.js"

vi.mock("../src/renderer/src/utils/fileActions.js", () => ({ moveFiles: vi.fn() }))

const DRAG = "../src/renderer/src/utils/drag.js"

const move = (x, y = 0) =>
  window.dispatchEvent(new MouseEvent("mousemove", { clientX: x, clientY: y }))
const upOn = (el, init = {}) =>
  el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, ...init }))
const $ = (id) => document.querySelector(`[data-id="${id}"]`)

function setRect(el, left, top, width = 50, height = 20) {
  el.getBoundingClientRect = () => ({ left, top, right: left + width, bottom: top + height })
}

beforeEach(() => {
  document.body.innerHTML = `
    <div class="tab-list">
      <div class="file" data-id="/a"></div>
      <div class="file selected" data-id="/b"></div>
      <div class="file selected" data-id="/c"></div>
      <div class="file" data-id="/dir" data-is-directory="true"></div>
    </div>`
  ;["/a", "/b", "/c", "/dir"].forEach((id, i) => setRect($(id), 0, i * 30))
  vi.mocked(moveFiles).mockClear()
})

function makeStates(path = "/home") {
  return {
    current: {
      getPath: () => path,
      activeTab: "1",
      setSelectedFiles: vi.fn(),
      dragDeadzone: 20,
      refresh: vi.fn()
    }
  }
}

describe("startDrag (box selection)", async () => {
  const { startDrag } = await importForPlatform("linux", DRAG)

  it("ignores buttons other than left", () => {
    const setSelected = vi.fn()
    startDrag({ button: 2, clientX: 0, clientY: 0 }, document.createElement("div"), setSelected)
    upOn(document.body)
    expect(setSelected).not.toHaveBeenCalled()
  })

  it("draws the box and selects the files inside it", () => {
    const box = document.createElement("div")
    const setSelected = vi.fn()
    startDrag({ button: 0, clientX: 10, clientY: 5 }, box, setSelected)

    move(40, 45)
    expect(box.style).toMatchObject({
      display: "block",
      left: "10px",
      top: "5px",
      width: "30px",
      height: "40px"
    })

    upOn(document.body)
    expect(setSelected).toHaveBeenCalledWith(["/a", "/b"])
    expect(box.style.display).toBe("none")
  })
})

describe("startFileDrag (linux)", async () => {
  const { startFileDrag } = await importForPlatform("linux", DRAG)
  const preview = document.createElement("div")

  it("ignores non-left buttons", () => {
    const states = makeStates()
    const setDragging = vi.fn()
    startFileDrag({ button: 1, target: $("/a") }, setDragging, preview, states)
    move(100)
    upOn($("/dir"))
    expect(setDragging).not.toHaveBeenCalledWith(true)
  })

  it("selects an unselected file it starts on", () => {
    const states = makeStates()
    startFileDrag({ button: 0, clientX: 0, clientY: 0, target: $("/a") }, vi.fn(), preview, states)
    upOn(document.body)
    expect(states.current.setSelectedFiles).toHaveBeenCalledWith(["/a"])
  })

  it("does not start dragging inside the dead zone", () => {
    const setDragging = vi.fn()
    startFileDrag(
      { button: 0, clientX: 0, clientY: 0, target: $("/b") },
      setDragging,
      preview,
      makeStates()
    )
    move(10)
    upOn($("/dir"))
    expect(setDragging).not.toHaveBeenCalledWith(true)
    expect(moveFiles).not.toHaveBeenCalled()
  })

  it("moves all selected files onto a folder", () => {
    const states = makeStates()
    const setDragging = vi.fn()
    startFileDrag(
      { button: 0, clientX: 0, clientY: 0, target: $("/b") },
      setDragging,
      preview,
      states
    )
    move(100)
    expect(setDragging).toHaveBeenCalledWith(true)

    upOn($("/dir"))
    expect(setDragging).toHaveBeenLastCalledWith(false)
    expect(moveFiles).toHaveBeenCalledWith(["/b", "/c"], "/dir", false, states.current.refresh)
  })

  it("copies when ctrl is held", () => {
    const states = makeStates()
    startFileDrag({ button: 0, clientX: 0, clientY: 0, target: $("/a") }, vi.fn(), preview, states)
    move(100)
    upOn($("/dir"), { ctrlKey: true })
    expect(moveFiles).toHaveBeenCalledWith(["/a"], "/dir", true, states.current.refresh)
  })

  it("does nothing when dropped on a file", () => {
    startFileDrag(
      { button: 0, clientX: 0, clientY: 0, target: $("/b") },
      vi.fn(),
      preview,
      makeStates()
    )
    move(100)
    upOn($("/a"))
    expect(moveFiles).not.toHaveBeenCalled()
  })
})

describe("startFileDrag (windows)", async () => {
  const { startFileDrag } = await importForPlatform("win32", DRAG)
  const preview = document.createElement("div")

  it("does not drag drives in This PC", () => {
    const states = makeStates("/")
    const setDragging = vi.fn()
    startFileDrag(
      { button: 0, clientX: 0, clientY: 0, target: $("/a") },
      setDragging,
      preview,
      states
    )
    move(100)
    upOn($("/dir"))
    expect(states.current.setSelectedFiles).not.toHaveBeenCalled()
    expect(setDragging).not.toHaveBeenCalled()
    expect(moveFiles).not.toHaveBeenCalled()
  })

  it("drags normally inside a drive", () => {
    const states = makeStates("C:/Users")
    startFileDrag({ button: 0, clientX: 0, clientY: 0, target: $("/a") }, vi.fn(), preview, states)
    move(100)
    upOn($("/dir"))
    expect(moveFiles).toHaveBeenCalled()
  })
})
