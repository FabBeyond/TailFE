export function startDrag(e, setDragBoxSize, setSelectedFiles) {
  if (e.button != 0) return

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
export function startFileDrag(e, setFileDraggingData, settingsRef) {
  const clickedOn = e.target.closest(".file")

  let selectedElements
  if (clickedOn.classList.contains("selected")) {
    selectedElements = [...document.querySelectorAll(".tab-list .file.selected")]
  } else {
    selectedElements = [clickedOn]
    settingsRef.current.setSelectedFiles([clickedOn.dataset.id])
  }

  let copy = false
  const selectedIds = selectedElements.map((item) => item.dataset.id)
  const upMostObject = selectedElements.reduce((top, item) =>
    top.getBoundingClientRect().top > item.getBoundingClientRect().top ? item : top
  )

  const startOffsetX = upMostObject.getBoundingClientRect().left - e.clientX
  const startOffsetY = upMostObject.getBoundingClientRect().top - e.clientY

  function onMouseMove(moveEvent) {
    setFileDraggingData({
      x: moveEvent.clientX + startOffsetX,
      y: moveEvent.clientY + startOffsetY
    })
    copy = moveEvent.ctrlKey
  }

  async function onMouseUp(upEvent) {
    if (Math.hypot(e.clientX - upEvent.clientX, e.clientY - upEvent.clientY) > 20) {
      const target = upEvent.target.closest(".file")
      const targetPath = target?.dataset.id
      const isFolder = target?.dataset.isDirectory === "true"
      if (isFolder) {
        selectedIds.forEach(async (item) => {
          await window.api.move(item, targetPath, copy)
        })
        settingsRef.current.setRefreshToken(1)
      }
    }
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
