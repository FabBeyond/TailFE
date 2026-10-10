let toasts = []
const listeners = new Set()

function emit() {
  for (const listener of listeners) listener()
}

export function showToast(message, type = "info", duration = 4000) {
  const id = crypto.randomUUID()
  toasts = [...toasts, { id, message, type }]
  emit()
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  }, duration)
}

export function subscribe(listener) {
  listeners.add(listener)
}
export function getToasts() {
  return toasts
}
