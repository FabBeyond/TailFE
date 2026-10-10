let toasts = []
const listeners = new Set()

const ERROR_MESSAGES = {
  EACCES: "Permission denied",
  EPERM: "Operation not permitted",
  EEXIST: "A file or folder with that name already exists",
  ENOENT: "The file or folder doesn't exist",
  ENOTDIR: "Not a folder",
  ENOTEMPTY: "The folder isn't empty",
  EBUSY: "The file is in use by another program",
  EINVAL: "Invalid name",
  EXDEV: "Can't move between drives"
}

export function errorMessage(code) {
  return ERROR_MESSAGES[code] ?? code ?? "Unknown error"
}

function emit() {
  for (const listener of listeners) listener()
}

export function showToast(title, message, type = "info", duration = 8000) {
  const id = crypto.randomUUID()
  toasts = [...toasts, { id, title, message, type }]
  emit()
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  }, duration)
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
export function getToasts() {
  return toasts
}
