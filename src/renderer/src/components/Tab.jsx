import { useEffect, useState } from "react"
import { useSettings } from "../hooks/useSettings"
import { useTabs } from "../hooks/useTabs"
import { startColumnResize } from "../utils/resize"
import { sortFiles, visibleFiles } from "../utils/fileUtils.js"
import File from "./File"
import { ChevronUp } from "lucide-react"

const COLUMNS = [
  { key: "name", label: "Name", className: "name", widthKey: "nameCol" },
  { key: "size", label: "Size", className: "size", widthKey: "sizeCol" },
  { key: "modified", label: "Last Modified", className: "last-modified" }
]

function Tab() {
  const { mainZoom, sortingMode, foldersOnTop, showDotFiles } = useSettings()
  const { getFiles, activeTab, getPath } = useTabs()

  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000)
    return () => clearInterval(id)
  }, [])

  const dir = getPath(activeTab)
  const files = sortFiles(
    visibleFiles(getFiles(activeTab), showDotFiles),
    sortingMode,
    foldersOnTop
  )
  const fileObjs = files.map((file) => (
    <File key={file.name} file={file} tabId={activeTab} tabPath={dir} />
  ))
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
        {active && <ChevronUp style={{ rotate: sortingMode.desc ? "0deg" : "180deg" }} />}
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
