import { useContext, useEffect, useRef } from 'react'
import { SettingsContext } from '../hooks/useSettings'
import { deleteFile, createFolder } from '../utils/fileActions'
import { concatPath, changeTabPath } from '../utils/paths.js'

function ContextMenu() {
  const {
    menu,
    setMenu,
    tabPaths,
    setTabPaths,
    activeTab,
    setRefreshToken,
    setSelectedFile,
    setRenaming
  } = useContext(SettingsContext)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menu) return
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenu(null)
      }
    }
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [menu, setMenu])

  return (
    menu && (
      <div className="context-menu" ref={menuRef} style={{ left: menu.x, top: menu.y }}>
        <ul>
          {menu.target && (
            <>
              <li>
                <button
                  onClick={async () => {
                    if (menu.isDirectory) {
                      changeTabPath(setTabPaths, activeTab, menu.target)
                    } else {
                      const result = await window.api.openFile(menu.target)
                      if (result.noProgram) {
                        console.log('no program :(')
                      }
                    }
                    setMenu(null)
                  }}
                >
                  Open
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    console.log('open with')
                    setMenu(null)
                  }}
                >
                  Open With
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    deleteFile(menu.target, tabPaths, activeTab, setRefreshToken)
                    setMenu(null)
                  }}
                >
                  Delete
                </button>
              </li>
            </>
          )}
          <li>
            <button
              onClick={() => {
                createFolder(tabPaths, activeTab, setRefreshToken)
                const newFolderPath = concatPath(
                  tabPaths[activeTab],
                  '1yt8034yhi1u9023Uht43R94YRgewrG'
                )
                setSelectedFile(newFolderPath)
                setRenaming(true)
                setMenu(null)
              }}
            >
              New Folder
            </button>
          </li>
          <li>
            <button
              onClick={() => {
                console.log('show properties')
                setMenu(null)
              }}
            >
              Properties
            </button>
          </li>
        </ul>
      </div>
    )
  )
}

export default ContextMenu
