import { useContext, useEffect, useRef } from "react"
import { SettingsContext } from "../hooks/useSettings"
import { deleteFile, createFolder } from "../utils/fileActions"
import { concatPath, changeTabPath } from "../utils/paths.js"
import data from "../data.json"

function ContextMenu() {
  const {
    menu,
    setMenu,
    tabPaths,
    activeTab,
    setRefreshToken,
    setSelectedFile,
    setRenaming,
    setTabPaths
  } = useContext(SettingsContext)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menu) return
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenu(null)
      }
    }
    window.addEventListener("click", onClick)
    return () => window.removeEventListener("click", onClick)
  }, [menu, setMenu])

  if (!menu) return null

  const actions = {
    openDefault: async () => {
      if (menu.isDirectory) {
        changeTabPath(setTabPaths, activeTab, menu.target)
      } else {
        const result = await window.api.openFile(menu.target)
        if (result.noProgram) {
          console.log("no program :(")
        }
      }
    },
    openChoose: () => console.log("open chooser"),
    newFolder: () => {
      createFolder(tabPaths, activeTab, setRefreshToken)
      const newFolderPath = concatPath(tabPaths[activeTab], "1yt8034yhi1u9023Uht43R94YRgewrG")
      setSelectedFile(newFolderPath)
      setRenaming(true)
    },
    deleteFile: () => deleteFile(menu.target, tabPaths, activeTab, setRefreshToken),
    showProperties: () => console.log("show properties")
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

  return (
    menu && (
      <div className="context-menu" ref={menuRef} style={{ left: menu.x, top: menu.y }}>
        <ul>
          {filteredData.map((item) => (
            <li key={item.action}>
              <button
                onClick={async () => {
                  await actions[item.action]()
                  setMenu(null)
                }}
              >
                {item.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  )
}

export default ContextMenu
