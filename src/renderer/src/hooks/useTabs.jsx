import { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from "react"
import { showToast, errorMessage } from "../utils/toast.js"
import { concatPath, removeLastPathElement } from "../utils/paths.js"

const TabsContext = createContext(null)
const INITIAL_TAB = {
  id: "1",
  path: "/",
  files: [],
  history: ["/"],
  historyIndex: 0
}

export function TabsProvider({ children }) {
  const [activeTab, setActiveTabState] = useState(INITIAL_TAB.id)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [tabs, setTabs] = useState([INITIAL_TAB])
  const [treeVersion, setTreeVersion] = useState(0)
  const loadIds = useRef(new Map())

  const loadTab = useCallback(async (id, path, update = (tab) => tab, climb = false) => {
    const loadId = (loadIds.current.get(id) ?? 0) + 1
    loadIds.current.set(id, loadId)

    let loadedPath = path
    let result = await window.api.readDir(path)
    const firstError = result.error
    while (climb && result.error && loadedPath !== "/") {
      loadedPath = removeLastPathElement(loadedPath)
      result = await window.api.readDir(loadedPath)
    }
    if (loadIds.current.get(id) !== loadId) return false

    if (result.error) {
      showToast("Can't open folder", `"${path}" - ${errorMessage(result.error)}`, "error")
      return false
    }
    if (loadedPath !== path) {
      showToast("Folder no longer exists", `"${path}" - ${errorMessage(firstError)}`, "error")
    }

    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id !== id) return tab
        const next = update(tab, loadedPath)
        return next ? { ...next, path: loadedPath, files: result } : tab
      })
    )

    const existing = new Set(result.map((file) => concatPath(loadedPath, file.name)))
    setSelectedFiles((prev) => {
      const next = prev.filter((p) => removeLastPathElement(p) !== loadedPath || existing.has(p))
      return next.length === prev.length ? prev : next
    })
    return true
  }, [])
  const navigate = useCallback(
    async (id, path) => {
      if (path.length > 1) path = path.replace(/\/+$/, "")

      const ok = await loadTab(id, path, (tab) => {
        if (path === tab.path) return tab
        const history = [...tab.history.slice(0, tab.historyIndex + 1), path]
        return { ...tab, history, historyIndex: history.length - 1 }
      })
      if (ok) setSelectedFiles([])
      return ok
    },
    [loadTab]
  )
  const addTab = useCallback(
    (path = "/") => {
      const id = crypto.randomUUID()
      setTabs((prev) => [...prev, { id, path, files: [], history: [path], historyIndex: 0 }])
      loadTab(id, path)
    },
    [loadTab]
  )
  const removeTab = useCallback((id) => {
    setTabs((prev) => prev.filter((tab) => tab.id !== id))
  }, [])

  const getTab = useCallback((id) => tabs.find((tab) => tab.id === id), [tabs])
  const getPath = useCallback((id) => getTab(id).path, [getTab])
  const moveInHistory = useCallback(
    async (id, step) => {
      const tab = getTab(id)
      const historyIndex = tab.historyIndex + step
      if (historyIndex < 0 || historyIndex >= tab.history.length) return
      const ok = await loadTab(id, tab.history[historyIndex], (tab) => ({ ...tab, historyIndex }))
      if (ok) setSelectedFiles([])
    },
    [getTab, loadTab]
  )
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
      return tabs[tabs.indexOf(getTab(id)) + idx]?.id ?? null
    },
    [tabs, getTab]
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
    tabs.forEach(({ id, path: startPath }) =>
      loadTab(
        id,
        startPath,
        (tab, loaded) => {
          if (tab.path !== startPath) return null
          if (loaded === startPath) return tab
          return { ...tab, history: tab.history.with(tab.historyIndex, loaded) }
        },
        true
      )
    )
    setTreeVersion((prev) => prev + 1)
  }, [tabs, loadTab])

  useEffect(() => {
    //eslint-disable-next-line react-hooks/set-state-in-effect -- setTabs runs after await
    loadTab(INITIAL_TAB.id, INITIAL_TAB.path)
  }, [loadTab])

  const setActiveTab = useCallback((id) => {
    setActiveTabState(id)
    setSelectedFiles([])
  }, [])

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      selectedFiles,
      setSelectedFiles,
      getTab,
      navigate,
      addTab,
      getPath,
      removeTab,
      getSelectedEntry,
      getFiles,
      moveInHistory,
      canMoveHistory,
      getNeighbourID,
      refresh,
      tabs,
      treeVersion
    }),
    [
      activeTab,
      selectedFiles,
      navigate,
      addTab,
      getPath,
      removeTab,
      getSelectedEntry,
      getFiles,
      moveInHistory,
      canMoveHistory,
      getNeighbourID,
      refresh,
      tabs,
      setActiveTab,
      getTab,
      treeVersion
    ]
  )

  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>
}

export const useTabs = () => useContext(TabsContext)
