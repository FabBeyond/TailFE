export default function trackPointer(onMove, onUp) {
  function handleUp(upEvent) {
    window.removeEventListener("mousemove", onMove)
    window.removeEventListener("mouseup", onUp)
    onUp?.(upEvent)
  }
  window.addEventListener("mousemove", onMove)
  window.addEventListener("mouseup", handleUp)
}
