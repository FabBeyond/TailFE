export const IS_WIN = window.api.platform === "win32"

export function concatPath(path1, path2) {
  if (IS_WIN && path1 === "/" && path2 !== "/") return `${path2}/`
  return `${path1}/${path2}`.replace(/\/+/g, "/")
}
export function removeLastPathElement(path) {
  if (IS_WIN && /^[A-Za-z]:\/$/.test(path)) return "/"
  const newPath = path.slice(0, path.lastIndexOf("/"))
  if (IS_WIN && /^[A-Za-z]:$/.test(newPath)) return newPath + "/"
  return newPath === "" ? "/" : newPath
}
export function hasDirectories(files) {
  files = files.filter((file) => file.isDirectory)
  return files.length > 0
}
export function readDirSafe(path, onSuccess) {
  window.api.readDir(path).then((result) => {
    if (!result.error) onSuccess(result)
  })
}
export function getCurrentDirName(path) {
  if (IS_WIN && path === "/") return "This PC"
  if (IS_WIN && /^[A-Za-z]:\/$/.test(path)) return path.slice(0, 2)
  const name = path.slice(path.lastIndexOf("/") + 1)
  return name === "" ? "/" : name
}
export function normalizePath(path) {
  if (IS_WIN) {
    path = path.replaceAll("\\", "/")
    path = path.replace(/^[a-z]:/, (d) => d.toUpperCase())
    if (/^[A-Z]:$/.test(path)) path += "/"
  }
  const isRoot = path === "/" || (IS_WIN && /^[A-Z]:\/$/.test(path))
  return isRoot ? path : path.replace(/\/+$/, "")
}
export function pathParts(path) {
  const parts = []
  let current = "/"
  for (const segment of path.split("/").filter(Boolean)) {
    current = concatPath(current, segment)
    parts.push({ label: segment, path: current })
  }
  return parts
}
