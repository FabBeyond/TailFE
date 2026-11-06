import { pathParts } from "./paths"

const UNITS = ["Bytes", "KB", "MB", "GB", "TB"]
const COMPARE = {
  name: (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }),
  size: (a, b) => a.size - b.size,
  modified: (a, b) => a.lastModified - b.lastModified
}

export function bytesToReadable(bytes) {
  let size = bytes
  let unit = 0

  while (size >= 1000 && unit < UNITS.length - 1) {
    size /= 1000
    unit++
  }
  return `${unit === 0 ? size : size.toFixed(1)} ${UNITS[unit]}`
}
export function sortFiles(files, { key, desc }, foldersOnTop) {
  return files.toSorted(
    (a, b) =>
      (foldersOnTop && b.isDirectory - a.isDirectory) ||
      (desc ? COMPARE[key](b, a) : COMPARE[key](a, b))
  )
}
export function visibleFiles(files, showDotFiles) {
  return showDotFiles ? files : files.filter((f) => !f.name.startsWith("."))
}
export function getFileExtension(path) {
  if (!path) return ""
  const name = path.slice(path.lastIndexOf("/") + 1)
  const dot = name.lastIndexOf(".")
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : ""
}
