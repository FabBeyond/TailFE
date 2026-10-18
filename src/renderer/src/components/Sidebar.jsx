import { useEffect, useState } from "react"
import { useSettings } from "../hooks/useSettings"
import { useTabs } from "../hooks/useTabs"
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
  const { sidebarWidth, setSidebarWidth } = useSettings()

  return (
    <div className="sidebar" style={{ width: sidebarWidth, flexShrink: 0 }}>
      <div className="sidebar-content">
        <Places />
        <RootFolderList />
      </div>
      <div
        className="resize-handle sidebar-resize-handle"
        onMouseDown={(e) => {
          startResize(e, sidebarWidth, setSidebarWidth)
        }}
      ></div>
    </div>
  )
}
function Places() {
  const [paths, setPaths] = useState({})

  useEffect(() => {
    data.sidebar.forEach((item) => {
      window.api.getPath(item.folder).then((result) => {
        if (!result.error) setPaths((prev) => ({ ...prev, [item.id]: result.path }))
      })
    })
  }, [])

  const sidebarIcons = {
    House: HouseIcon,
    FileText: FileTextIcon,
    ArrowDownToLine: ArrowDownToLineIcon,
    Image: ImageIcon
  }
  const { setTabPaths, activeTab } = useTabs()

  return (
    <div className="places">
      <p>PLACES</p>
      {data["sidebar"].map((item) => {
        const Icon = sidebarIcons[item.icon] ?? FolderIcon

        return (
          <div
            className="places-entry"
            key={item.id}
            onClick={() => {
              changeTabPath(setTabPaths, activeTab, paths[item.id])
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
    <div className="folder-tree">
      <p>FOLDERS</p>
      <ul className="folder-list">
        <FLFolder folderName={{ name: "/", isDirectory: true }} curPath="/" />
      </ul>
    </div>
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
  const { showDotFiles } = useSettings()
  const { activeTab, setTabPaths } = useTabs()

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
        <ChevronRightIcon
          className={`${open ? "arrow-open" : ""} ${!hasDirectories(children) ? "hide" : ""}`}
          style={{ cursor: "pointer" }}
          onClick={() => {
            const next = !open
            setOpen(next)
          }}
        />
        <FolderIcon className="folder-icon" />
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
