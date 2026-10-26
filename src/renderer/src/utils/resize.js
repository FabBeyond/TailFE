import trackPointer from "./pointer"

export function startResize(e, startWidth, onResize) {
  e.stopPropagation()
  e.preventDefault()

  const startX = e.clientX

  trackPointer((moveEvent) => {
    onResize(startWidth + (moveEvent.clientX - startX))
  })
}
export function startColumnResize(e, columnWidths, setColumnWidths, column) {
  startResize(e, columnWidths[column], (newWidth) => {
    setColumnWidths((prev) => ({ ...prev, [column]: newWidth }))
  })
}
