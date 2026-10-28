import { createContext, useContext, useMemo, useState } from "react"

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [showDotFiles, setShowDotFiles] = useState(false)
  const [mainZoom, setMainZoom] = useState(20)
  const [columnWidths, setColumnWidths] = useState({ nameCol: 300, sizeCol: 150 })
  const [sidebarWidth, setSidebarWidth] = useState(200)
  const [foldersOnTop, setFoldersOnTop] = useState(true)
  const [dragDeadzone, setDragDeadzone] = useState(20)
  const [sortingMode, setSortingMode] = useState({ key: "name", desc: false })

  const value = useMemo(
    () => ({
      showDotFiles,
      setShowDotFiles,
      mainZoom,
      setMainZoom,
      columnWidths,
      setColumnWidths,
      sidebarWidth,
      setSidebarWidth,
      sortingMode,
      setSortingMode,
      foldersOnTop,
      setFoldersOnTop,
      dragDeadzone,
      setDragDeadzone
    }),
    [showDotFiles, mainZoom, columnWidths, sidebarWidth, sortingMode, foldersOnTop, dragDeadzone]
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export const useSettings = () => useContext(SettingsContext)
