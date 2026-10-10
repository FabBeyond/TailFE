import { useContext, useEffect, useRef, useState } from "react"
import { SettingsContext } from "../hooks/useSettings"
import { readDirSafe } from "../utils/paths"
import { startColumnResize } from "../utils/resize"
import File from "./File"

function Tab({ path, tabId }) {
  const [files, setFiles] = useState([])
  const {
    mainZoom,
    columnWidths,
    setColumnWidths,
    setHistory,
    historyIndex,
    setHistoryIndex,
    isHistoryChangeRef,
    refreshToken,
    setRefreshToken,
    setSelectedFile
  } = useContext(SettingsContext)

  const lastRecordedPathRef = useRef(null)

  useEffect(() => {
    readDirSafe(path, setFiles)
    setRefreshToken(0)
    if (isHistoryChangeRef.current) {
      lastRecordedPathRef.current = path
      isHistoryChangeRef.current = false
    } else if (lastRecordedPathRef.current !== path) {
      lastRecordedPathRef.current = path
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), path])
      setHistoryIndex((i) => i + 1)
    }
  }, [
    path,
    refreshToken,
    historyIndex,
    isHistoryChangeRef,
    setHistory,
    setHistoryIndex,
    setRefreshToken
  ])
  useEffect(() => {
    setSelectedFile(null)
  }, [path, setSelectedFile])

  const fileObjs = files.map((file) => <File key={file.name} file={file} tabId={tabId} />)
  return (
    <>
      <div className="files-headers" style={{ fontSize: mainZoom }}>
        <p className="name" style={{ width: columnWidths.nameCol }}>
          Name
        </p>
        <div
          className="resize-handle"
          onMouseDown={(e) => startColumnResize(e, columnWidths, setColumnWidths, "nameCol")}
        ></div>
        <p className="size" style={{ width: columnWidths.sizeCol }}>
          Size
        </p>
        <div
          className="resize-handle"
          onMouseDown={(e) => startColumnResize(e, columnWidths, setColumnWidths, "sizeCol")}
        ></div>
        <p className="last-modified">Last Modified</p>
      </div>
      <ul className="file-list">{fileObjs}</ul>
    </>
  )
}

export default Tab
