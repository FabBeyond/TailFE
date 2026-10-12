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
