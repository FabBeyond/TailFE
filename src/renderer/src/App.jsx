import { useEffect, useRef, useState } from 'react'
import { SettingsContext, useSettings } from './hooks/useSettings'
import { changeTabPath, concatPath, readDirSafe } from './utils/paths'
import { startResize } from './utils/resize'
import TopBar from './components/TopBar'
import Tab from './components/Tab'
import { RootFolderList } from './components/FolderTree'
import ContextMenu from './components/ContextMenu'

function handleKeyDown(e, settings) {
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return
  const {insertMode, setInsertMode, kbdSearchLet, setKdbSearchLet, activeTab, tabPaths, setTabPaths,
  mainZoom, setMainZoom, history, setHistory, historyIndex, setHistoryIndex, selectedFile, setRenaming} = settings

  // make Shift+i super insert mode where you type the full path
  if (e.key === "i" && !insertMode) {
    e.preventDefault()
    setInsertMode(true)
    return
  }
  else if (e.key === "Escape" && insertMode) {
    e.preventDefault()
    setInsertMode(false)
    setKdbSearchLet("")
    return
  }

  if (insertMode) {
    setKdbSearchLet(prev => {
      if (e.key === "Shift") return prev
      if (e.key === "Backspace") {
        return prev.slice(0, -1)
      }
      if (e.key === "Enter") {
        if (prev === ".") {
          // move backwards
        }
        changeTabPath(setTabPaths, activeTab, concatPath(tabPaths[activeTab], prev))
        setInsertMode(false)
        return ""
      }
      return prev + e.key
    })
  }
  else {
    if (e.key === ",") {
      setMainZoom(prev => {
        return prev-2
      })
    }
    else if (e.key === ".") {
      setMainZoom(prev => {
        return prev+2
      })
    }
    else if (e.key === "<") {
      if (historyIndex > 0) {
        settings.isHistoryChange.current = true
        setHistoryIndex(i => i-1)
        changeTabPath(setTabPaths, activeTab, history[historyIndex-1])
      }
    }
    else if (e.key === ">") {
      if (historyIndex+1 < history.length) {
        settings.isHistoryChange.current = true
        setHistoryIndex(i => i+1)
        changeTabPath(setTabPaths, activeTab, history[historyIndex+1])
      }
    }
    else if (e.key === "F2") {
      setRenaming(i => true)
    }
  }
}

function App() {
  const [entries, setEntries] = useState([])
  const [curPath, setCurPath] = useState('/')
  const [sidebarWidth, setSidebarWidth] = useState(200)

  const settings = useSettings()
  const {tabPaths, setMenu} = settings

  const settingsRef = useRef(settings)
  settingsRef.current = settings

  useEffect(() => {
    const listener = (e) => handleKeyDown(e, settingsRef.current)
    window.addEventListener("keydown", listener)
    return () => window.removeEventListener("keydown", listener)
  }, [])

  useEffect(() => {
    readDirSafe(curPath, setEntries)
  }, [curPath])

  const tabs = tabPaths.map((path, idx) => (
    <Tab key={idx} path={path} tabId={idx}/>
  ))

  useEffect(() => {
    const listener = (e) => {
      e.preventDefault()
      const target = e.target.closest(".file")
      setMenu({x: e.clientX, y: e.clientY, target: target?.dataset.path ?? null, isDirectory: target?.dataset.isDirectory === "true"})
    }
    window.addEventListener("contextmenu", listener)
    return () => window.removeEventListener("contextmenu", listener)
  }, [])
  return (
    <SettingsContext.Provider value={settings}>
      <TopBar/>
      <div className="bottom-part">
        <div className="sidebar" style={{width: sidebarWidth, flexShrink: 0}}>
          <RootFolderList files={entries} curPath={curPath}/>
        </div>
        <div className="resize-handle" onMouseDown={(e) => startResize(e, sidebarWidth, setSidebarWidth)}></div>
        <ul className="tab-list">
          {tabs}
        </ul>
      </div>
      <ContextMenu/>
    </SettingsContext.Provider>
  )
}

export default App
