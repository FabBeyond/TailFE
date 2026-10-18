import { createContext, useContext, useMemo, useRef, useState } from "react"

const TabsContext = createContext(null)

export function TabsProvider({ children }) {
  const [tabPaths, setTabPaths] = useState(["/"])
  const [tabFiles, setTabFiles] = useState([[]])
  const [activeTab, setActiveTab] = useState(0)
  const [history, setHistory] = useState([])
  const isHistoryChangeRef = useRef(false)
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [refreshToken, setRefreshToken] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState([])

  const value = useMemo(
    () => ({
      tabPaths,
      setTabPaths,
      tabFiles,
      setTabFiles,
      activeTab,
      setActiveTab,
      history,
      setHistory,
      isHistoryChangeRef,
      historyIndex,
      setHistoryIndex,
      refreshToken,
      setRefreshToken,
      selectedFiles,
      setSelectedFiles
    }),
    [tabPaths, tabFiles, activeTab, history, historyIndex, refreshToken, selectedFiles]
  )

  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>
}

export const useTabs = () => useContext(TabsContext)
