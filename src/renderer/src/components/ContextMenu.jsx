import { useContext, useEffect, useRef } from 'react'
import { SettingsContext } from '../hooks/useSettings'
import { deleteFile, createFolder } from '../utils/fileActions'
import { concatPath } from '../utils/paths.js'

function ContextMenu() {
  const {menu, setMenu, tabPaths, activeTab, setRefreshToken, selectedFile, setSelectedFile, setRenaming} = useContext(SettingsContext)
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
  }, [menu])

  return (
    (menu && <div className="context-menu" ref={menuRef} style={{left: menu.x, top: menu.y}}>
      <ul>
        {menu.target &&
          <li><button onClick={() => {
            deleteFile(menu.target, tabPaths, activeTab, setRefreshToken)
            setMenu(null)
          }}>Delete</button></li>
        }
        <li><button onClick={() => {
          createFolder(tabPaths, activeTab, setRefreshToken)
          const newFolderPath = concatPath(tabPaths[activeTab], "1yt8034yhi1u9023Uht43R94YRgewrG")
          setSelectedFile(newFolderPath)
          setRenaming(true)
          setMenu(null)
        }}>New Folder</button>
        </li>
      </ul>
    </div>
    )
  )
}

export default ContextMenu
