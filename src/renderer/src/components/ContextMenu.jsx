import { useContext, useEffect, useRef } from "react"
import { SettingsContext } from "../hooks/useSettings"
import { deleteFile, createFolder, openFile } from "../utils/fileActions"
import { changeTabPath } from "../utils/paths.js"
import data from "../data.json"
import {
  FolderIcon,
  SquareArrowOutUpRightIcon,
  PenIcon,
  FolderPlusIcon,
  InfoIcon,
  TrashIcon
} from "lucide-react"

function ContextMenu() {
  const {
    menu,
    setMenu,
    tabPaths,
    activeTab,
    setRefreshToken,
    setSelectedFile,
    setRenaming,
    setTabPaths,
    setPropertiesShown
  } = useContext(SettingsContext)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menu) return
    setSelectedFile(menu.target)
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenu(null)
      }
    }
    window.addEventListener("click", onClick)
    return () => window.removeEventListener("click", onClick)
  }, [menu, setMenu, setSelectedFile])

  if (!menu) return null

  const actions = {
    openDefault: async () => {
      if (menu.isDirectory) {
        changeTabPath(setTabPaths, activeTab, menu.target)
      } else {
        await openFile(menu.target)
      }
    },
    openChoose: () => console.log("open chooser"),
    newFolder: async () => {
      const path = await createFolder(tabPaths[activeTab], setRefreshToken)
      if (path) {
        setSelectedFile(path)
        setRenaming(true)
      }
    },
    delete: () => deleteFile(menu.target, tabPaths, activeTab, setRefreshToken),
    showProperties: () => setPropertiesShown(true)
  }
  const conditions = {
    hasTarget: () => !!menu.target,
    isFile: () => !!menu.target && !menu.isDirectory,
    isDirectory: () => !!menu.target && menu.isDirectory
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
