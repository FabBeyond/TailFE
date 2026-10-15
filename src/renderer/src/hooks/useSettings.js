import { createContext, useEffect, useRef, useState } from "react"

export const SettingsContext = createContext()

export function useSettings() {
  const [showDotFiles, setShowDotFiles] = useState(false)
  const [tabPaths, setTabPaths] = useState(["/"])
  const [tabFiles, setTabFiles] = useState([[]])
  const [activeTab, setActiveTab] = useState(0)
  const [insertMode, setInsertMode] = useState(false)
  const [kbdSearchLet, setKdbSearchLet] = useState("")
  const [mainZoom, setMainZoom] = useState(20)
  const [columnWidths, setColumnWidths] = useState({ nameCol: 300, sizeCol: 150 })
  const [sidebarWidth, setSidebarWidth] = useState(200)
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000)
    return () => clearInterval(id)
  })
  const [history, setHistory] = useState([])
  const isHistoryChangeRef = useRef(false)
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [menu, setMenu] = useState(null)
  const [refreshToken, setRefreshToken] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [renaming, setRenaming] = useState(false)
  const [propertiesShown, setPropertiesShown] = useState(false)
  const [pathWriting, setPathWriting] = useState(false)
  const [sortingMode, setSortingMode] = useState("name")
  const [foldersOnTop, setFoldersOnTop] = useState(true)
  const [dragBoxSize, setDragBoxSize] = useState({ height: 0, width: 0, x: 0, y: 0 })
  const [fileDraggingData, setFileDraggingData] = useState(null)

  return {
    showDotFiles,
    setShowDotFiles,
    tabPaths,
    setTabPaths,
    tabFiles,
    setTabFiles,
    insertMode,
    setInsertMode,
    kbdSearchLet,
    setKdbSearchLet,
    activeTab,
    setActiveTab,
    mainZoom,
    setMainZoom,
    columnWidths,
    setColumnWidths,
    history,
    setHistory,
    isHistoryChangeRef,
    historyIndex,
    setHistoryIndex,
    menu,
    setMenu,
    refreshToken,
    setRefreshToken,
    selectedFiles,
    setSelectedFiles,
    renaming,
    setRenaming,
    propertiesShown,
    setPropertiesShown,
    pathWriting,
    setPathWriting,
    sidebarWidth,
    setSidebarWidth,
    sortingMode,
    setSortingMode,
    foldersOnTop,
    setFoldersOnTop,
    dragBoxSize,
    setDragBoxSize,
    fileDraggingData,
    setFileDraggingData
  }
}
