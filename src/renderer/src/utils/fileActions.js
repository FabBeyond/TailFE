import { concatPath } from './paths'

export function deleteFile(path, tabPaths, activeTab, setRefreshToken) {
  const result = window.api.deleteFile(path)
  if (!result.error) {
    setRefreshToken(1)
  }
  else {
    console.log(result.error)
  }
}
export function createFolder(tabPaths, activeTab, setRefreshToken) {
  const result = window.api.createFolder(concatPath(tabPaths[activeTab], "NewFolder"))
  if (!result.error) {
    setRefreshToken(1)
  }
  else {
    console.log(result.error)
  }
}
export function rename(path, newPath, setRefreshToken) {
  const result = window.api.rename(path)
  if (!result.error) {
    setRefreshToken(1)
  }
  else {
    console.log(result.error)
  }
}
