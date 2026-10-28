import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { showToast, errorMessage } from "../utils/toast.js"
import { concatPath } from "../utils/paths.js"

const TabsContext = createContext(null)

export function TabsProvider({ children }) {
  const [activeTab, setActiveTabState] = useState("1")
  const [refreshToken, setRefreshToken] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [tabs, setTabs] = useState([
    { id: "1", path: "/", files: [], loadedPath: null, history: ["/"], historyIndex: 0 }
  ])

  const navigate = useCallback(async (id, path) => {
    const result = await window.api.readDir(path)
    if (result.error) {
      showToast("Can't open folder", `"${path}" - ${errorMessage(result.error)}`, "error")
      return false
    }
    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id !== id) return tab
        if (path === tab.path) return { ...tab, files: result, loadedPath: path }
        const history = [...tab.history.slice(0, tab.historyIndex + 1), path]
        return {
          ...tab,
          path,
          files: result,
          loadedPath: path,
          history,
          historyIndex: history.length - 1
        }
      })
    )
    return true
  }, [])
  const moveInHistory = useCallback((id, step) => {
    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id !== id) return tab
        const newIdx = tab.historyIndex + step
        if (newIdx < 0 || newIdx >= tab.history.length) return tab
        return { ...tab, path: tab.history[newIdx], historyIndex: newIdx }
      })
    )
  }, [])
  const addTab = useCallback((path = "/") => {
    setTabs((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        path: path,
        files: [],
        loadedPath: null,
        history: [path],
        historyIndex: 0
      }
    ])
  }, [])
  const removeTab = useCallback((id) => {
    setTabs((prev) => prev.filter((tab) => tab.id !== id))
  }, [])
  const setTabFiles = useCallback((id, files, path) => {
    setTabs((prev) =>
      prev.map((tab) => (tab.id === id ? { ...tab, files, loadedPath: path } : tab))
    )
  }, [])

  const getTab = useCallback((id) => tabs.find((tab) => tab.id === id), [tabs])
  const getPath = useCallback((id) => getTab(id).path, [getTab])
  const getFiles = useCallback((id) => getTab(id).files, [getTab])
  const getSelectedEntry = useCallback(
    (id, selectedFile) => {
      const dir = getPath(id)
      return getFiles(id).find((file) => concatPath(dir, file.name) === selectedFile)
    },
    [getPath, getFiles]
  )
  const getNeighbourID = useCallback(
    (id, idx) => {
      const curTab = tabs.find((i) => i.id === id)
      return tabs[tabs.indexOf(curTab) + idx]?.id ?? null
    },
    [tabs]
  )
  const canMoveHistory = useCallback(
    (id) => {
      const tab = getTab(id)
      return {
        backwards: tab.historyIndex != 0,
        forwards: tab.history.length != tab.historyIndex + 1
      }
    },
    [getTab]
  )
  const refresh = useCallback(() => {
    setRefreshToken((i) => i + 1)
  }, [])

  const setActiveTab = useCallback((id) => {
    setActiveTabState(id)
    setSelectedFiles([])
  }, [])

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      refreshToken,
      selectedFiles,
      setSelectedFiles,
      navigate,
      addTab,
      getPath,
      removeTab,
      getSelectedEntry,
      getFiles,
      moveInHistory,
      canMoveHistory,
      setTabFiles,
      getNeighbourID,
      refresh,
      tabs
    }),
    [
      activeTab,
      refreshToken,
      selectedFiles,
      navigate,
      addTab,
      getPath,
      removeTab,
      getSelectedEntry,
      getFiles,
      moveInHistory,
      canMoveHistory,
      setTabFiles,
      getNeighbourID,
      refresh,
      tabs,
      setActiveTab
    ]
  )

  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>
}

export const useTabs = () => useContext(TabsContext)
