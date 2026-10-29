import { showToast, errorMessage } from "./toast.js"

export async function deleteFile(paths, refresh) {
  await Promise.all(
    paths.map(async (item) => {
      const result = await window.api.deleteFile(item)
      if (result.error) showToast("Couldn't delete", errorMessage(result.error), "error")
    })
  )
  refresh()
}
export async function createFolder(dir, refresh) {
  const result = await window.api.createFolder(dir)
  if (result.error) {
    showToast("Couldn't create folder", errorMessage(result.error), "error")
    return null
  }

  refresh()
  return result.path
}
export async function rename(path, newPath, refresh) {
  const result = await window.api.rename(path, newPath)
  if (result.error) {
    showToast("Couldn't rename", errorMessage(result.error), "error")
    return false
  }
  refresh()
  return true
}
export async function openFile(path) {
  const result = await window.api.openFile(path)
  if (result.noProgram) {
    showToast("No default app", "No program is set to open this file type", "warning")
  } else if (result.error) {
    showToast("Couldn't open file", result.error, "error")
  }
}
export async function moveFiles(selectedIds, targetPath, copy, refresh) {
  await Promise.all(
    selectedIds.map(async (item) => {
      if (item !== targetPath) {
        const result = await window.api.move(item, targetPath, copy)
        if (result.error)
          showToast(`Couldn't ${copy ? "copy" : "move"} file`, errorMessage(result.error), "error")
      }
    })
  )
  refresh()
}
