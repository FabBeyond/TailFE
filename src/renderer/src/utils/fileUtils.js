const UNITS = ["Bytes", "KB", "MB", "GB", "TB"]

export function bytesToReadable(bytes) {
  let size = bytes
  let unit = 0

  while (size >= 1000 && unit < UNITS.length - 1) {
    size /= 1000
    unit++
  }
  return `${unit === 0 ? size : size.toFixed(1)} ${UNITS[unit]}`
}
export function sortFiles(files, param, foldersOnTop) {
  let sorted = []
  if (files.length === 0) return []
  if (param === "name") sorted = files.toSorted((a, b) => a.name.localeCompare(b.name))
  else if (param === "-name") sorted = files.toSorted((a, b) => b.name.localeCompare(a.name))
  else if (param === "size") sorted = files.toSorted((a, b) => a.size - b.size)
  else if (param === "-size") sorted = files.toSorted((a, b) => b.size - a.size)
  else if (param === "modified") sorted = files.toSorted((a, b) => a.lastModified - b.lastModified)
  else if (param === "-modified") sorted = files.toSorted((a, b) => b.lastModified - a.lastModified)

  if (foldersOnTop) {
    const folders = sorted.filter((item) => item.isDirectory)
    const nonFolders = sorted.filter((item) => !item.isDirectory)
    return folders.concat(nonFolders)
  }

  return sorted
}
