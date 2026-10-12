export function concatPath(path1, path2) {
  return `${path1}/${path2}`.replace(/\/+/g, "/")
}
export function removeLastPathElement(path) {
  const lastIndex = path.lastIndexOf("/")
  let newPath = path.slice(0, lastIndex)
  return newPath === "" ? "/" : newPath
}
export function changeTabPath(setTabPaths, tabId, newPath) {
  setTabPaths((prev) => {
    const next = [...prev]
    next[tabId] = newPath
    return next
  })
}
export function hasDirectories(files) {
  files = files.filter((file) => file.isDirectory)
  return files.length > 0
}
export function getSelectedEntry(tabFiles, tabPaths, activeTab, selectedFile) {
  const dir = tabPaths[activeTab]
  return (tabFiles[activeTab] ?? []).find((file) => concatPath(dir, file.name) === selectedFile)
}
export function readDirSafe(path, onSuccess) {
  window.api.readDir(path).then((result) => {
    if (!result.error) onSuccess(result)
  })
}
export function moveInHistory(settings, step) {
  const { history, historyIndex, setHistoryIndex, isHistoryChangeRef, setTabPaths, activeTab } =
    settings
  const newIndex = historyIndex + step
  if (newIndex < 0 || newIndex >= history.length) return

  isHistoryChangeRef.current = true
  setHistoryIndex(newIndex)
  changeTabPath(setTabPaths, activeTab, history[newIndex])
}
