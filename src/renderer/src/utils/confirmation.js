let current = null
const listeners = new Set()

function emit() {
  for (const listener of listeners) listener()
}

export function confirm(
  message,
  { title = "Are you sure?", confirmText = "Yes", cancelText = "Cancel" } = {}
) {
  current?.resolve(false)
  return new Promise((resolve) => {
    current = { title, message, confirmText, cancelText, resolve }
    emit()
  })
}

export function answerConfirmation(answer) {
  current?.resolve(answer)
  current = null
  emit()
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getConfirmation() {
  return current
}
