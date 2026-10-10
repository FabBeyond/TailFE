import { concatPath } from "./paths"

export async function deleteFile(path, tabPaths, activeTab, setRefreshToken) {
  const result = await window.api.deleteFile(path)
  if (!result.error) {
    setRefreshToken(1)
  } else {
    console.log(result.error)
  }
}
export async function createFolder(tabPaths, activeTab, setRefreshToken) {
  const result = await window.api.createFolder(
    concatPath(tabPaths[activeTab], "1yt8034yhi1u9023Uht43R94YRgewrG")
  )
  if (!result.error) {
    setRefreshToken(1)
  } else {
    console.log(result.error)
  }
}
export async function rename(path, newPath, setRefreshToken) {
  const result = await window.api.rename(path)
  if (!result.error) {
    setRefreshToken(1)
  } else {
    console.log(result.error)
  }
}
