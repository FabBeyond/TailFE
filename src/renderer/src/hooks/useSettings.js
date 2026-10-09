import { createContext, useEffect, useRef, useState } from 'react'

export const SettingsContext = createContext()

export function useSettings() {
  const [showDotFiles, setShowDotFiles] = useState(false)
  const [tabPaths, setTabPaths] = useState(["/"])
  const [activeTab, setActiveTab] = useState(0)
  const [insertMode, setInsertMode] = useState(false)
  const [kbdSearchLet, setKdbSearchLet] = useState("")
  const [mainZoom, setMainZoom] = useState(20)
  const [columnWidths, setColumnWidths] = useState({nameCol: 300, sizeCol: 150})
  const [tick, setTick] =  useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t+1), 60000)
    return () =>  clearInterval(id)
  })
  const [history, setHistory] = useState([])
  const isHistoryChange = useRef(false)
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [menu, setMenu] = useState(null)
  const [refreshToken, setRefreshToken] = useState(0)
  const [selectedFile, setSelectedFile] = useState(null)
  const [renaming, setRenaming] = useState(false)

  return {showDotFiles, setShowDotFiles, tabPaths, setTabPaths, insertMode, setInsertMode, kbdSearchLet, setKdbSearchLet,
    activeTab, setActiveTab, mainZoom, setMainZoom, columnWidths, setColumnWidths, history, setHistory, isHistoryChange,
    historyIndex, setHistoryIndex, menu, setMenu, refreshToken, setRefreshToken, selectedFile, setSelectedFile, renaming, setRenaming}
}
