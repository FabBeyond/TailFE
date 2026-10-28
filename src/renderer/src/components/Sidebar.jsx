import { useEffect, useState } from "react"
import { useSettings } from "../hooks/useSettings"
import { useTabs } from "../hooks/useTabs"
import { concatPath, hasDirectories, readDirSafe } from "../utils/paths"
import {
  ChevronRightIcon,
  FolderIcon,
  HouseIcon,
  FileTextIcon,
  ArrowDownToLineIcon,
  ImageIcon
} from "lucide-react"
import { startResize } from "../utils/resize"

const PLACES = [
  { name: "Home", icon: HouseIcon, folder: "home" },
  { name: "Documents", icon: FileTextIcon, folder: "documents" },
  { name: "Downloads", icon: ArrowDownToLineIcon, folder: "downloads" },
  { name: "Pictures", icon: ImageIcon, folder: "pictures" }
]

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
    PLACES.forEach(({ folder }) => {
      window.api.getPath(folder).then((result) => {
        if (!result.error) setPaths((prev) => ({ ...prev, [folder]: result.path }))
      })
    })
  }, [])

  const { activeTab, navigate } = useTabs()

  return (
    <div className="places">
      <p>PLACES</p>
      {PLACES.map(({ name, icon: Icon, folder }) => (
        <div
          className="places-entry"
          key={folder}
          onClick={() => {
            navigate(activeTab, paths[folder])
          }}
        >
          <Icon />
          <p>{name}</p>
        </div>
      ))}
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
  const { activeTab, navigate } = useTabs()

  useEffect(() => {
    readDirSafe(concatPath(curPath, folderName.name), setChildren)
  }, [open, folderName.name, curPath])

  if (!showDotFiles && folderName.name.startsWith(".")) return

  return (
    <div className="fl-folder">
      <div className="fl-folder-content">
        <ChevronRightIcon
          className={`${open ? "arrow-open" : ""} ${!hasDirectories(children) ? "hide" : ""}`}
          style={{ cursor: "pointer" }}
          onClick={() => {
            setOpen((i) => !i)
          }}
        />
        <FolderIcon className="folder-icon" />
        <button onClick={() => navigate(activeTab, concatPath(curPath, folderName.name))}>
          <p>{folderName.name}</p>
        </button>
      </div>
      {open && <FolderList files={children} curPath={concatPath(curPath, folderName.name)} />}
    </div>
  )
}
