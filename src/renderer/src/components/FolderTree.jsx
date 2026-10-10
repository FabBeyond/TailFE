import { useContext, useEffect, useState } from "react"
import { SettingsContext } from "../hooks/useSettings"
import { concatPath, changeTabPath, hasDirectories, readDirSafe } from "../utils/paths"
import { icons } from "../utils/icons"

export function RootFolderList() {
  return (
    <ul className="folder-list">
      <FLFolder folderName={{ name: "/", isDirectory: true }} curPath="/" />
    </ul>
  )
}
export function FolderList({ files, curPath }) {
  files = files.filter((file) => file.isDirectory)
  const flFolders = files.map((file) => (
    <FLFolder key={file.name} folderName={file} curPath={curPath} />
  ))

  return <ul className="folder-list">{flFolders}</ul>
}
export function FLFolder({ folderName, curPath }) {
  const [open, setOpen] = useState(false)
  const [children, setChildren] = useState([])
  const { showDotFiles, activeTab, setTabPaths } = useContext(SettingsContext)

  useEffect(() => {
    readDirSafe(concatPath(curPath, folderName.name), setChildren)
  }, [open, folderName.name, curPath])

  useEffect(() => {
    if (open) {
      readDirSafe(concatPath(curPath, folderName.name), setChildren)
    }
  }, [open, curPath, folderName.name])

  if (!showDotFiles && folderName.name.startsWith(".")) return

  return (
    <div className="fl-folder">
      <div className="fl-folder-content">
        <button
          className={`${open ? "arrow-open" : ""} ${!hasDirectories(children) ? "hide" : ""}`}
          onClick={() => {
            const next = !open
            setOpen(next)
          }}
        >
          <img src={icons["arrow-icon.png"]} />
        </button>
        <img src={icons["folder-icon.png"]} alt="folder icon" />
        <button
          onClick={() =>
            changeTabPath(setTabPaths, activeTab, concatPath(curPath, folderName.name))
          }
        >
          <p>{folderName.name}</p>
        </button>
      </div>
      {open && <FolderList files={children} curPath={concatPath(curPath, folderName.name)} />}
    </div>
  )
}
