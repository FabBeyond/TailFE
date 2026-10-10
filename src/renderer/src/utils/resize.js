export function startResize(e, startWidth, onResize) {
  const startX = e.clientX

  function onMouseMove(moveEvent) {
    onResize(startWidth + (moveEvent.clientX - startX))
  }
  function onMouseUp() {
    window.removeEventListener("mousemove", onMouseMove)
    window.removeEventListener("mouseup", onMouseUp)
  }
  window.addEventListener("mousemove", onMouseMove)
  window.addEventListener("mouseup", onMouseUp)
}
export function startColumnResize(e, columnWidths, setColumnWidths, column) {
  startResize(e, columnWidths[column], (newWidth) => {
    setColumnWidths((prev) => ({ ...prev, [column]: newWidth }))
  })
}
