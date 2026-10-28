import { Fragment, useEffect, useRef } from "react"
import { useTabs } from "../hooks/useTabs"
import { useUI } from "../hooks/useUI"
import { createFolder, deleteFile, openFile } from "../utils/fileActions"
import {
  FolderIcon,
  SquareArrowOutUpRightIcon,
  FolderPlusIcon,
  InfoIcon,
  TrashIcon
} from "lucide-react"
import { showToast } from "../utils/toast.js"

function ContextMenu() {
  const { menu, setMenu, setRenaming, setPropertiesShown } = useUI()
  const {
    activeTab,
    setSelectedFiles,
    setActiveTab,
    selectedFiles,
    navigate,
    addTab,
    getPath,
    removeTab,
    getNeighbourID,
    refresh,
    tabs
  } = useTabs()
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menu) return
    if (menu.type === "file") {
      setSelectedFiles((prev) => (prev.includes(menu.target) ? prev : [menu.target]))
    } else if (menu.type === "tab") setActiveTab(menu.target)
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenu(null)
      }
    }
    window.addEventListener("click", onClick)
    return () => window.removeEventListener("click", onClick)
  }, [menu, setMenu, setSelectedFiles, setActiveTab])

  if (!menu) return null

  const isEntry = !!menu.target && menu.type === "file"
  const isDirectory = isEntry && menu.isDirectory
  const isTab = !!menu.target && menu.type === "tab"

  const groups = [
    [
      {
        name: "Open",
        icon: FolderIcon,
        show: isEntry,
        action: async () => {
          if (menu.isDirectory) {
            navigate(activeTab, menu.target)
          } else {
            await openFile(menu.target)
          }
        }
      },
      {
        name: "Open With",
        icon: SquareArrowOutUpRightIcon,
        show: isEntry,
        action: () => console.log("open chooser")
      },
      {
        name: "Open in new Tab",
        icon: SquareArrowOutUpRightIcon,
        show: isDirectory,
        action: () => addTab(menu.target)
      }
    ],
    [
      {
        name: "New Folder",
        icon: FolderPlusIcon,
        show: true,
        action: async () => {
          const path = await createFolder(getPath(activeTab), refresh)
          if (path) {
            setSelectedFiles([path])
            setRenaming(true)
          }
        }
      },
      {
        name: "Properties",
        icon: InfoIcon,
        show: isEntry,
        action: () => setPropertiesShown(true)
      }
    ],
    [
      {
        name: "Close Tab",
        icon: TrashIcon,
        show: isTab,
        action: () => {
          if (tabs.length === 1) {
            showToast("Can't close Tab", "Can't close last open Tab", "error")
            return
          }
          const neighbourId = getNeighbourID(menu.target, -1) ?? getNeighbourID(menu.target, 1)
          setActiveTab(neighbourId)
          removeTab(menu.target)
        }
      },
      {
        name: "Delete",
        icon: TrashIcon,
        show: isEntry,
        action: () => deleteFile(selectedFiles, refresh)
      }
    ]
  ]
    .map((group) => group.filter((item) => item.show))
    .filter((group) => group.length > 0)

  return (
    <div className="context-menu" ref={menuRef} style={{ left: menu.x, top: menu.y }}>
      {groups.map((group, idx) => (
        <Fragment key={idx}>
          {idx > 0 && <div className="context-menu-divider"></div>}
          <ul>
            {group.map(({ name, icon: Icon, action }) => (
              <li key={name}>
                <button
                  onClick={async () => {
                    await action()
                    setMenu(null)
                  }}
                >
                  <Icon />
                  {name}
                </button>
              </li>
            ))}
          </ul>
        </Fragment>
      ))}
    </div>
  )
}

export default ContextMenu
