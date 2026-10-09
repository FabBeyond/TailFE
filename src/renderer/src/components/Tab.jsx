import { useContext, useEffect, useRef, useState } from 'react'
import { SettingsContext } from '../hooks/useSettings'
import { readDirSafe } from '../utils/paths'
import { startColumnResize } from '../utils/resize'
import File from './File'

function Tab({path, tabId}) {
  const [files, setFiles] = useState([])
  const {mainZoom, columnWidths, setColumnWidths, history, setHistory,
    historyIndex, setHistoryIndex, isHistoryChange, refreshToken, setRefreshToken, setSelectedFile} = useContext(SettingsContext)

  const lastRecordedPath = useRef(null)

  useEffect(() => {
    setSelectedFile(null)
    readDirSafe(path, setFiles)
    setRefreshToken(0)
    if (isHistoryChange.current) {
      lastRecordedPath.current = path
      isHistoryChange.current = false
    }
    else if (lastRecordedPath.current !== path){
      lastRecordedPath.current = path
      setHistory(prev => [...prev.slice(0, historyIndex + 1), path])
      setHistoryIndex(i => i+1)
    }
  }, [path, refreshToken])

  const fileObjs = files.map(file => (
    <File key={file.name} file={file} tabId={tabId}/>
  ))
  return (
    <>
      <div className="files-headers" style={{fontSize: mainZoom}}>
        <p className="name" style={{width: columnWidths.nameCol}}>Name</p>
        <div className="resize-handle" onMouseDown={(e) => startColumnResize(e, columnWidths, setColumnWidths, "nameCol")}></div>
        <p className="size" style={{width: columnWidths.sizeCol}}>Size</p>
        <div className="resize-handle" onMouseDown={(e) => startColumnResize(e, columnWidths, setColumnWidths, "sizeCol")}></div>
        <p className="last-modified">Last Modified</p>
      </div>
      <ul className="file-list">
        {fileObjs}
      </ul>
    </>
  )
}

export default Tab
