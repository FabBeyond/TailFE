import { showToast } from "./toast.js"

export async function deleteFile(path, tabPaths, activeTab, setRefreshToken) {
  const result = await window.api.deleteFile(path)
  if (!result.error) {
    setRefreshToken(1)
  } else {
    console.log(result.error)
  }
}
export async function createFolder(dir, setRefreshToken) {
  const result = await window.api.createFolder(dir)
  if (result.error) {
    console.log(result.error)
    return null
  }

  setRefreshToken(1)
  return result.path
}
export async function rename(path, newPath, setRefreshToken) {
  const result = await window.api.rename(path, newPath)
  console.log(result)
  if (!result.error) {
    setRefreshToken(1)
  } else {
    showToast(result.error)
    console.log(result.error)
  }
}
