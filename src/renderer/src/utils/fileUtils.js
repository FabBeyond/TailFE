const UNITS = ["Bytes", "KB", "MB", "GB", "TB"]
const COMPARE = {
  name: (a, b) => a.name.localeCompare(b.name),
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
  const sorted = files.toSorted((a, b) => (desc ? COMPARE[key](b, a) : COMPARE[key](a, b)))

  if (foldersOnTop) {
    const folders = sorted.filter((item) => item.isDirectory)
    const nonFolders = sorted.filter((item) => !item.isDirectory)
    return folders.concat(nonFolders)
  }

  return sorted
}
