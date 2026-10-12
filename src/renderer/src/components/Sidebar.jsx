import { useContext, useEffect, useState } from "react"
import { SettingsContext } from "../hooks/useSettings"
import { concatPath, changeTabPath, hasDirectories, readDirSafe } from "../utils/paths"
import {
  ChevronRightIcon,
  FolderIcon,
  HouseIcon,
  FileTextIcon,
  ArrowDownToLineIcon,
  ImageIcon
} from "lucide-react"
import { startResize } from "../utils/resize"
import data from "../data.json"

export function Sidebar() {
  const settings = useContext(SettingsContext)

  return (
    <div className="sidebar" style={{ width: settings.sidebarWidth, flexShrink: 0 }}>
      <div className="sidebar-content">
        <Places />
        <RootFolderList />
      </div>
      <div
        className="resize-handle"
        onMouseDown={(e) => {
          startResize(e, settings.sidebarWidth, settings.setSidebarWidth)
        }}
      ></div>
    </div>
  )
}
function Places() {
  const sidebarIcons = {
    House: HouseIcon,
    FileText: FileTextIcon,
    ArrowDownToLine: ArrowDownToLineIcon,
    Image: ImageIcon
  }
  const settings = useContext(SettingsContext)

  return (
    <div className="places">
      <p>PLACES</p>
      {data["sidebar"].map((item) => {
        const Icon = sidebarIcons[item.icon] ?? FolderIcon

        return (
          <div
            key={item.id}
            onClick={() => {
              changeTabPath(settings.setTabPaths, settings.activeTab, item.path)
            }}
          >
            <Icon />
            <p>{item.name}</p>
          </div>
        )
      })}
    </div>
  )
}

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
          <ChevronRightIcon />
        </button>
        <FolderIcon />
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
