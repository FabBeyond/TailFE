import { useContext } from 'react'
import { SettingsContext } from '../hooks/useSettings'
import { concatPath, changeTabPath } from '../utils/paths'
import { icons } from '../utils/icons'
import { timeAgo } from '../utils/timeAgo'

function File({file, tabId}) {
  const {showDotFiles, tick} = useContext(SettingsContext)
  const {tabPaths, setTabPaths, mainZoom, columnWidths, setColumnWidths, selectedFile, setSelectedFile} = useContext(SettingsContext)

  if (!showDotFiles && file.name.startsWith(".")) return

  const path = concatPath(tabPaths[tabId], file.name)

  return (
    <div className="file" style={{backgroundColor: selectedFile == path ? "#FF0000" : "none"}} data-path={concatPath(tabPaths[tabId], file.name)}>
      <button style={{fontSize: mainZoom}} onClick={() => {
        setSelectedFile(path)
      }} onDoubleClick={() => {
        changeTabPath(setTabPaths, tabId, concatPath(tabPaths[tabId], file.name))
      }}>
        <div className="file-name" style={{width: columnWidths.nameCol}}>
          {file.isDirectory ? (
            <img src={icons["folder-icon.png"]} alt="folder-icon"/>
          ) : (
            <img src={icons["file-icon.png"]} alt="file-icon"/>
          )}
          <p>{file.name}</p>
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
