import { useContext, useState } from 'react'
import { SettingsContext } from '../hooks/useSettings'
import { concatPath, changeTabPath } from '../utils/paths'
import { icons } from '../utils/icons'
import { timeAgo } from '../utils/timeAgo'

function File({file, tabId}) {
  const {showDotFiles, tick} = useContext(SettingsContext)
  const {tabPaths, setTabPaths, mainZoom, columnWidths, setColumnWidths, selectedFile, setSelectedFile, renaming, setRenaming, setRefreshToken} = useContext(SettingsContext)
  const [tempName, setTempName] = useState("")

  if (!showDotFiles && file.name.startsWith(".")) return

  const path = concatPath(tabPaths[tabId], file.name)

  return (
    <div className="file" style={{backgroundColor: selectedFile === path ? "#FF0000" : "transparent"}} data-path={concatPath(tabPaths[tabId], file.name)}>
      <button style={{fontSize: mainZoom}} onClick={() => {
        setTempName(file.name)
        setSelectedFile(path)
      }} onDoubleClick={async () => {
        if (file.isDirectory) {
          changeTabPath(setTabPaths, tabId, concatPath(tabPaths[tabId], file.name))
        }
        else {
          const result = await window.api.openFile(path)
          console.log(result)
          if (result.noProgram) {
            console.log("no program")
          }
        }
      }}>
        <div className="file-name" style={{width: columnWidths.nameCol}}>
          {file.isDirectory ? (
            <img src={icons["folder-icon.png"]} alt="folder-icon"/>
          ) : (
            <img src={icons["file-icon.png"]} alt="file-icon"/>
          )}
          {(renaming && selectedFile === path) ? (
            <input type="text" autoFocus className="rename-input" value={tempName} onChange={(e) => {
              setTempName(e.target.value)
            }} onKeyUp={(e) => {
              if (e.key === "Enter") {
                window.api.rename(path, concatPath(tabPaths[tabId], e.target.value))
                setRefreshToken(1)
                setRenaming(false)
                e.target.blur()
              }
              else if (e.key === "Escape") {
                setRenaming(false)
                e.target.blur()
              }
            }}/>
          ) : (
            <p>{file.name}</p>
          )}
        </div>
        <div className="file-size" style={{width: columnWidths.sizeCol}}>
          {!file.isDirectory &&
            <p>{file.size} bytes</p>
          }
        </div>
        <div className="file-last-modified">
          <p>{timeAgo.format(file.lastModified)}</p>
        </div>
      </button>
    </div>
  )
}

export default File
