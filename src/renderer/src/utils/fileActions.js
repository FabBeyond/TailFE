import { showToast, errorMessage } from "./toast.js"

export async function deleteFile(path, tabPaths, activeTab, setRefreshToken) {
  const result = await window.api.deleteFile(path)
  if (result.error) {
    showToast("Couldn't delete", errorMessage(result.error), "error")
    return
  }
  setRefreshToken(1)
}
export async function createFolder(dir, setRefreshToken) {
  const result = await window.api.createFolder(dir)
  if (result.error) {
    showToast("Couldn't create folder", errorMessage(result.error), "error")
    return null
  }

  setRefreshToken(1)
  return result.path
}
export async function rename(path, newPath, setRefreshToken) {
  const result = await window.api.rename(path, newPath)
  if (result.error) {
    showToast("Couldn't rename", errorMessage(result.error), "error")
    return
  }
  setRefreshToken(1)
}
export async function openFile(path) {
  const result = await window.api.openFile(path)
  if (result.noProgram) {
    showToast("No default app", "No program is set to open this file type", "warning")
  } else if (result.error) {
    showToast("Couldn't open file", result.error, "error")
  }
}
