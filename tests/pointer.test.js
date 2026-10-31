import { describe, expect, it, vi } from "vitest"
import trackPointer from "../src/renderer/src/utils/pointer.js"
import { startColumnResize, startResize } from "../src/renderer/src/utils/resize.js"

const move = (x, y = 0) =>
  window.dispatchEvent(new MouseEvent("mousemove", { clientX: x, clientY: y }))
const up = () => window.dispatchEvent(new MouseEvent("mouseup"))

describe("trackPointer", () => {
  it("forwards moves until mouseup, then removes its listeners", () => {
    const onMove = vi.fn()
    const onUp = vi.fn()
    trackPointer(onMove, onUp)

    move(1)
    move(2)
    up()
    move(3)
    up()

    expect(onMove).toHaveBeenCalledTimes(2)
    expect(onUp).toHaveBeenCalledTimes(1)
  })

  it("works without an onUp callback", () => {
    trackPointer(vi.fn())
    expect(up).not.toThrow()
  })
})

describe("startResize", () => {
  it("stops the event and reports start width plus the drag distance", () => {
    const e = { clientX: 100, stopPropagation: vi.fn(), preventDefault: vi.fn() }
    const onResize = vi.fn()
    startResize(e, 200, onResize)

    move(150)
    move(80)
    up()

    expect(e.stopPropagation).toHaveBeenCalled()
    expect(e.preventDefault).toHaveBeenCalled()
    expect(onResize.mock.calls).toEqual([[250], [180]])
  })
})

describe("startColumnResize", () => {
  it("updates only the dragged column", () => {
    let widths = { nameCol: 300, sizeCol: 150 }
    const setWidths = (fn) => (widths = fn(widths))
    const e = { clientX: 0, stopPropagation() {}, preventDefault() {} }

    startColumnResize(e, widths, setWidths, "sizeCol")
    move(50)
    up()

    expect(widths).toEqual({ nameCol: 300, sizeCol: 200 })
  })
})
