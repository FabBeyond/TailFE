import { useEffect, useState, useRef } from "react"
import { useSettings } from "../hooks/useSettings"
import { useTabs } from "../hooks/useTabs"
import { showToast, errorMessage } from "../utils/toast.js"
import { startColumnResize } from "../utils/resize"
import { removeLastPathElement } from "../utils/paths.js"
import { sortFiles } from "../utils/fileUtils.js"
import File from "./File"
import { ChevronUp } from "lucide-react"

const COLUMNS = [
  { key: "name", label: "Name", className: "name", widthKey: "nameCol" },
  { key: "size", label: "Size", className: "size", widthKey: "sizeCol" },
  { key: "modified", label: "Last Modified", className: "last-modified" }
]

function Tab({ path, tabId, loadedPath }) {
  const { mainZoom, sortingMode, foldersOnTop } = useSettings()
  const { refreshToken, setSelectedFiles, activeTab, navigate, getFiles, setTabFiles } = useTabs()

  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000)
    return () => clearInterval(id)
  }, [])

  const lastRefresh = useRef(refreshToken)
  useEffect(() => {
    const isRefresh = lastRefresh.current !== refreshToken
    lastRefresh.current = refreshToken
    if (!isRefresh && loadedPath === path) return
    window.api.readDir(path).then((result) => {
      if (result.error) {
        navigate(tabId, removeLastPathElement(path))
        showToast("Can't open folder", errorMessage(result.error), "error")
        return
      }
      setTabFiles(tabId, result, path)
    })
  }, [path, refreshToken, tabId, navigate, setTabFiles, loadedPath])

  useEffect(() => {
    setSelectedFiles([])
  }, [path, setSelectedFiles])

  if (tabId != activeTab) return

  const files = sortFiles(getFiles(tabId), sortingMode, foldersOnTop)
  const fileObjs = files.map((file) => <File key={file.name} file={file} tabId={tabId} />)
  return (
    <>
      <div
        className="files-headers"
        style={{ fontSize: mainZoom }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {COLUMNS.map((column) => (
          <FileHeader key={column.key} column={column} />
        ))}
      </div>
      <ul className="file-list">{fileObjs}</ul>
    </>
  )
}

function FileHeader({ column }) {
  const { columnWidths, setColumnWidths, sortingMode, setSortingMode } = useSettings()
  const { key, label, className, widthKey } = column
  const active = sortingMode.key === key

  return (
    <>
      <div className="file-header">
        <p
          className={className}
          style={widthKey && { width: columnWidths[widthKey] - 4 }}
          onClick={() => setSortingMode({ key, desc: active && !sortingMode.desc })}
        >
          {label}
        </p>
        <ChevronUp style={{ rotate: active && sortingMode.desc ? "0deg" : "180deg" }} />
      </div>
      {widthKey && (
        <div
          className="resize-handle"
          onMouseDown={(e) => startColumnResize(e, columnWidths, setColumnWidths, widthKey)}
        ></div>
      )}
    </>
  )
}

export default Tab
