import { useEffect, useRef } from "react"
import { useTabs } from "../hooks/useTabs"
import { useUI } from "../hooks/useUI"
import { createFolder, deleteFile, openFile } from "../utils/fileActions"
import data from "../data.json"
import {
  FolderIcon,
  SquareArrowOutUpRightIcon,
  PenIcon,
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

  const actions = {
    openDefault: async () => {
      if (menu.isDirectory) {
        navigate(activeTab, menu.target)
      } else {
        await openFile(menu.target)
      }
    },
    openChoose: () => console.log("open chooser"),
    openNewTab: () => {
      addTab(menu.target)
    },
    newFolder: async () => {
      const path = await createFolder(getPath(activeTab), refresh)
      if (path) {
        setSelectedFiles([path])
        setRenaming(true)
      }
    },
    delete: () => deleteFile(selectedFiles, refresh),
    showProperties: () => setPropertiesShown(true),
    closeTab: () => {
      if (tabs.length === 1) {
        showToast("Can't close Tab", "Can't close last open Tab", "error")
        return
      }
      setActiveTab(() => {
        let neighbourId = getNeighbourID(activeTab, -1)
        return neighbourId == null ? getNeighbourID(activeTab, 1) : neighbourId
      })
      removeTab(activeTab)
    }
  }
  const conditions = {
    hasTarget: () => !!menu.target,
    isFile: () => !!menu.target && !menu.isDirectory,
    isDirectory: () => !!menu.target && menu.isDirectory,
    isTab: () => !!menu.target && menu.type === "tab",
    isEntry: () => !!menu.target && menu.type === "file"
  }

  const filteredData = data["contextMenu"].filter((item) => {
    for (const name of item.condition) {
      if (!conditions[name]()) return false
    }
    return true
  })

  const contextMenuIcons = {
    Folder: FolderIcon,
    SquareArrowOutUpRight: SquareArrowOutUpRightIcon,
    PenIcon: PenIcon,
    FolderPlus: FolderPlusIcon,
    Info: InfoIcon,
    Trash: TrashIcon
  }

  return (
    menu && (
      <div className="context-menu" ref={menuRef} style={{ left: menu.x, top: menu.y }}>
        <ul>
          {filteredData.map((item, idx) => {
            const Icon = contextMenuIcons[item.icon]

            return (
              <li key={idx}>
                {item.name !== "divider" ? (
                  <button
                    onClick={async () => {
                      await actions[item.action]()
                      setMenu(null)
                    }}
                  >
                    <Icon />
                    {item.name}
                  </button>
                ) : (
                  <div className="context-menu-divider"></div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    )
  )
}

export default ContextMenu
