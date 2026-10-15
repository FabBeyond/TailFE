export function startDrag(e, setDragBoxSize) {
  let startX = e.clientX
  let startY = e.clientY
  setDragBoxSize((i) => ({
    ...i,
    x: e.clientX,
    y: e.clientY
  }))

  function onMouseMove(moveEvent) {
    const currentX = moveEvent.clientX
    const currentY = moveEvent.clientY

    setDragBoxSize({
      x: Math.min(startX, currentX),
      y: Math.min(startY, currentY),
      width: Math.abs(currentX - startX),
      height: Math.abs(currentY - startY)
    })
  }
  function onMouseUp() {
    window.removeEventListener("mousemove", onMouseMove)
    window.removeEventListener("mouseup", onMouseUp)
    setDragBoxSize({ width: 0, height: 0, x: 0, y: 0 })
  }
  window.addEventListener("mousemove", onMouseMove)
  window.addEventListener("mouseup", onMouseUp)
}
