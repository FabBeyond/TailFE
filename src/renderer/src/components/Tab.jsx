import { useEffect, useRef, useState } from "react"
import { useSettings } from "../hooks/useSettings"
import { useTabs } from "../hooks/useTabs"
import { showToast, errorMessage } from "../utils/toast.js"
import { startColumnResize } from "../utils/resize"
import { removeLastPathElement, changeTabPath } from "../utils/paths.js"
import { sortFiles } from "../utils/fileUtils.js"
import File from "./File"
import { ChevronUp } from "lucide-react"

function Tab({ path, tabId }) {
  const { mainZoom, columnWidths, setColumnWidths, sortingMode, setSortingMode, foldersOnTop } =
    useSettings()
  const {
    tabFiles,
    setTabFiles,
    setHistory,
    historyIndex,
    setHistoryIndex,
    isHistoryChangeRef,
    refreshToken,
    setRefreshToken,
    setSelectedFiles,
    setTabPaths,
    activeTab
  } = useTabs()

  const lastRecordedPathRef = useRef(null)

  // re-render every minute so "Last Modified" times stay current
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    window.api.readDir(path).then((result) => {
      if (result.error) {
        changeTabPath(setTabPaths, tabId, removeLastPathElement(path))
        showToast("Can't open folder", errorMessage(result.error), "error")
        return
      }
      setTabFiles((prev) => {
        const next = [...prev]
        next[tabId] = result
        return next
      })
    })
  }, [path, refreshToken, tabId, setTabPaths, setTabFiles])

  useEffect(() => {
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
    setSelectedFiles([])
  }, [path, setSelectedFiles])

  if (tabId != activeTab) return

  const files = sortFiles(tabFiles[tabId], sortingMode, foldersOnTop)
  const fileObjs = files.map((file) => <File key={file.name} file={file} tabId={tabId} />)
  return (
    <>
      <div
        className="files-headers"
        style={{ fontSize: mainZoom }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="file-header">
          <p
            className="name"
            style={{ width: columnWidths.nameCol - 4 }}
            onClick={() => setSortingMode(sortingMode.startsWith("-") ? "name" : "-name")}
          >
            Name
          </p>
          <ChevronUp style={{ rotate: sortingMode === "-name" ? "0deg" : "180deg" }} />
        </div>
        <div
          className="resize-handle"
          onMouseDown={(e) => startColumnResize(e, columnWidths, setColumnWidths, "nameCol")}
        ></div>
        <div className="file-header">
          <p
            className="size"
            style={{ width: columnWidths.sizeCol - 4 }}
            onClick={() => setSortingMode(sortingMode.startsWith("-") ? "size" : "-size")}
          >
            Size
          </p>
          <ChevronUp style={{ rotate: sortingMode === "-size" ? "0deg" : "180deg" }} />
        </div>
        <div
          className="resize-handle"
          onMouseDown={(e) => startColumnResize(e, columnWidths, setColumnWidths, "sizeCol")}
        ></div>
        <div className="file-header">
          <p
            className="last-modified"
            onClick={() => setSortingMode(sortingMode.startsWith("-") ? "modified" : "-modified")}
          >
            Last Modified
          </p>
          <ChevronUp style={{ rotate: sortingMode === "-modified" ? "0deg" : "180deg" }} />
        </div>
      </div>
      <ul className="file-list">{fileObjs}</ul>
    </>
  )
}

export default Tab
