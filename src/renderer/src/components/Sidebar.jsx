import { useEffect, useState } from "react"
import { useSettings } from "../hooks/useSettings"
import { useTabs } from "../hooks/useTabs"
import { concatPath, getCurrentDirName, readDirSafe } from "../utils/paths"
import {
  ChevronRightIcon,
  FolderIcon,
  HouseIcon,
  FileTextIcon,
  ArrowDownToLineIcon,
  ImageIcon
} from "lucide-react"
import { startResize } from "../utils/resize"
import { visibleFiles } from "../utils/fileUtils"

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
          onClick={() => paths[folder] && navigate(activeTab, paths[folder])}
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
        <FLFolder path="/" />
      </ul>
    </div>
  )
}
export function FolderList({ files, curPath }) {
  const { showDotFiles } = useSettings()
  const flFolders = visibleFiles(files, showDotFiles)
    .filter((f) => f.isDirectory)
    .map((file) => <FLFolder key={file.name} path={concatPath(curPath, file.name)} />)

  return <ul className="folder-list">{flFolders}</ul>
}
export function FLFolder({ path }) {
  const [open, setOpen] = useState(false)
  const [children, setChildren] = useState([])
  const { activeTab, navigate, treeVersion } = useTabs()

  useEffect(() => {
    if (open) readDirSafe(path, setChildren)
  }, [open, path, treeVersion])

  return (
    <div className="fl-folder">
      <div className="fl-folder-content">
        <ChevronRightIcon
          className={`${open ? "arrow-open" : ""}`}
          style={{ cursor: "pointer" }}
          onClick={() => {
            setOpen((i) => !i)
          }}
        />
        <FolderIcon className="folder-icon" />
        <button onClick={() => navigate(activeTab, path)}>
          <p>{getCurrentDirName(path)}</p>
        </button>
      </div>
      {open && <FolderList files={children} curPath={path} />}
    </div>
  )
}
