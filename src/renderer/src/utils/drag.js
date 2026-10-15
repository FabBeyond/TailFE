export function startDrag(e, setDragBoxSize, setSelectedFiles) {
  const startX = e.clientX
  const startY = e.clientY
  let box = { x: startX, y: startY, width: 0, height: 0 }
  setDragBoxSize((i) => ({
    ...i,
    x: e.clientX,
    y: e.clientY
  }))

  function onMouseMove(moveEvent) {
    const currentX = moveEvent.clientX
    const currentY = moveEvent.clientY

    box = {
      x: Math.min(startX, currentX),
      y: Math.min(startY, currentY),
      width: Math.abs(currentX - startX),
      height: Math.abs(currentY - startY)
    }
    setDragBoxSize(box)
  }
  function onMouseUp() {
    window.removeEventListener("mousemove", onMouseMove)
    window.removeEventListener("mouseup", onMouseUp)

    setSelectedFiles(getElementsInBox(box, ".file").map((el) => el.dataset.id))
    setDragBoxSize({ width: 0, height: 0, x: 0, y: 0 })
  }
  window.addEventListener("mousemove", onMouseMove)
  window.addEventListener("mouseup", onMouseUp)
}
export function startFileDrag(e, setFileDraggingData) {
  let upMostObject = null
  document.querySelectorAll(".tab-list .file.selected").forEach((item) => {
    if (
      !upMostObject ||
      upMostObject.getBoundingClientRect().top > item.getBoundingClientRect().top
    )
      upMostObject = item
  })

  const startOffsetX = upMostObject.getBoundingClientRect().left - e.clientX
  const startOffsetY = upMostObject.getBoundingClientRect().top - e.clientY

  function onMouseMove(moveEvent) {
    setFileDraggingData({
      x: moveEvent.clientX + startOffsetX,
      y: moveEvent.clientY + startOffsetY
    })
  }

  function onMouseUp() {
    setFileDraggingData(null)
    window.removeEventListener("mousemove", onMouseMove)
    window.removeEventListener("mouseup", onMouseUp)
  }
  window.addEventListener("mousemove", onMouseMove)
  window.addEventListener("mouseup", onMouseUp)
}
function getElementsInBox(box, selector) {
  return [...document.querySelectorAll(selector)].filter((el) => {
    const r = el.getBoundingClientRect()
    return (
      r.left < box.x + box.width &&
      r.right > box.x &&
      r.top < box.y + box.height &&
      r.bottom > box.y
    )
  })
}
