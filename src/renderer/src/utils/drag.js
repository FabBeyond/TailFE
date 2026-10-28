import trackPointer from "./pointer.js"
import { moveFiles } from "./fileActions.js"

export function startDrag(e, boxElement, setSelectedFiles) {
  if (e.button != 0) return

  const startX = e.clientX
  const startY = e.clientY
  let box = { x: startX, y: startY, width: 0, height: 0 }

  trackPointer(onMouseMove, onMouseUp)

  function onMouseMove(moveEvent) {
    const currentX = moveEvent.clientX
    const currentY = moveEvent.clientY

    box = {
      x: Math.min(startX, currentX),
      y: Math.min(startY, currentY),
      width: Math.abs(currentX - startX),
      height: Math.abs(currentY - startY)
    }
    Object.assign(boxElement.style, {
      display: "block",
      left: box.x + "px",
      top: box.y + "px",
      width: box.width + "px",
      height: box.height + "px"
    })
  }
  function onMouseUp() {
    setSelectedFiles(getElementsInBox(box, ".file").map((el) => el.dataset.id))
    boxElement.style.display = "none"
  }
}
export function startFileDrag(e, setIsFileDragging, previewElement, statesRef) {
  if (e.button != 0) return
  const clickedOn = e.target.closest(".file")
  let draggingFile = false

  let selectedElements
  if (clickedOn.classList.contains("selected")) {
    selectedElements = [...document.querySelectorAll(".tab-list .file.selected")]
  } else {
    selectedElements = [clickedOn]
    statesRef.current.setSelectedFiles([clickedOn.dataset.id])
  }

  const selectedIds = selectedElements.map((item) => item.dataset.id)
  const upMostObject = selectedElements[0]

  const startOffsetX = upMostObject.getBoundingClientRect().left - e.clientX
  const startOffsetY = upMostObject.getBoundingClientRect().top - e.clientY

  trackPointer(onMouseMove, onMouseUp)
  function onMouseMove(moveEvent) {
    previewElement.style.transform = `translate(${moveEvent.clientX + startOffsetX}px, ${moveEvent.clientY + startOffsetY}px)`
    if (
      Math.hypot(e.clientX - moveEvent.clientX, e.clientY - moveEvent.clientY) >
        statesRef.current.dragDeadzone &&
      !draggingFile
    ) {
      draggingFile = true
      setIsFileDragging(true)
    }
  }

  function onMouseUp(upEvent) {
    setIsFileDragging(false)
    if (draggingFile) {
      const target = upEvent.target.closest(".file")
      const targetPath = target?.dataset.id
      const isFolder = target?.dataset.isDirectory === "true"
      if (isFolder) {
        moveFiles(selectedIds, targetPath, upEvent.ctrlKey, statesRef.current.refresh)
      }
    }
  }
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
