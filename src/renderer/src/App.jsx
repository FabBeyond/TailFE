import { useEffect, useRef, useState } from "react"
import { SettingsContext, useSettings } from "./hooks/useSettings"
import {
  changeTabPath,
  concatPath,
  moveInHistory,
  readDirSafe,
  getCurrentDirName,
  removeLastPathElement,
  getSelectedEntry
} from "./utils/paths"
import TopBar from "./components/TopBar"
import Tab from "./components/Tab"
import Properties from "./components/Properties.jsx"
import Toast from "./components/Toast.jsx"
import { Sidebar } from "./components/Sidebar"
import ContextMenu from "./components/ContextMenu"
import { startDrag, startFileDrag } from "./utils/drag.js"
import File from "./components/File.jsx"

function handleKeyDown(e, settings) {
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return
  const {
    insertMode,
    setInsertMode,
    setKdbSearchLet,
    activeTab,
    tabPaths,
    setTabPaths,
    setMainZoom,
    setRenaming,
    selectedFiles
  } = settings

  // make Shift+i super insert mode where you type the full path
  if (e.key === "i" && !insertMode) {
    e.preventDefault()
    setInsertMode(true)
    return
  } else if (e.key === "Escape" && insertMode) {
    e.preventDefault()
    setInsertMode(false)
    setKdbSearchLet("")
    return
  }

  if (insertMode) {
    setKdbSearchLet((prev) => {
      if (e.key === "Shift") return prev
      if (e.key === "Backspace") {
        return prev.slice(0, -1)
      }
      if (e.key === "Enter") {
        if (prev.startsWith(".")) {
          let newPath = tabPaths[activeTab]
          for (let i = 0; i < prev.length; i++) {
            newPath = removeLastPathElement(newPath)
          }
          changeTabPath(setTabPaths, activeTab, newPath)
          return ""
        }
        changeTabPath(setTabPaths, activeTab, concatPath(tabPaths[activeTab], prev))
        setInsertMode(false)
        return ""
      }
      return prev + e.key
    })
  } else {
    if (e.key === ",") {
      setMainZoom((prev) => {
        return prev - 2
      })
    } else if (e.key === ".") {
      setMainZoom((prev) => {
        return prev + 2
      })
    } else if (e.key === "<") {
      moveInHistory(settings, -1)
    } else if (e.key === ">") {
      moveInHistory(settings, 1)
    } else if (e.key === "F2") {
      if (selectedFiles.length === 1) setRenaming(true)
    }
  }
}

function Drag({ settings }) {
  return (
    <div
      className="drag-box"
      style={{
        position: "fixed",
        height: settings.dragBoxSize.height,
        width: settings.dragBoxSize.width,
        top: settings.dragBoxSize.y,
        left: settings.dragBoxSize.x
      }}
    ></div>
  )
}

function App() {
  const [, setEntries] = useState([])
  const [curPath] = useState("/")

  const settings = useSettings()
  const { tabPaths, setMenu } = settings

  const settingsRef = useRef(settings)

  useEffect(() => {
    settingsRef.current = settings
  })

  useEffect(() => {
    const listener = (e) => handleKeyDown(e, settingsRef.current)
    window.addEventListener("keydown", listener)
    return () => window.removeEventListener("keydown", listener)
  }, [])

  useEffect(() => {
    readDirSafe(curPath, setEntries)
  }, [curPath])

  const tabs = tabPaths.map((path, idx) => <Tab key={idx} path={path} tabId={idx} />)

  useEffect(() => {
    const listener = (e) => {
      e.preventDefault()
      const target = e.target.closest("[data-context]")
      setMenu({
        x: e.clientX,
        y: e.clientY,
        type: target?.dataset.context ?? "background",
        target: target?.dataset.id ?? null,
        isDirectory: target?.dataset.isDirectory === "true"
      })
    }
    window.addEventListener("contextmenu", listener)
    return () => window.removeEventListener("contextmenu", listener)
  }, [setMenu])
  return (
    <SettingsContext.Provider value={settings}>
      <TopBar />
      <div className="bottom-part">
        <Sidebar />
        <div className="tabs">
          <div className="tab-headers">
            {tabPaths.map((item, idx) => (
              <div
                key={idx}
                className="tab-header"
                onClick={() => {
                  settings.setActiveTab(idx)
                }}
                style={{
                  backgroundColor:
                    settings.activeTab == idx ? "var(--accent-faded)" : "var(--bars-colors)"
                }}
                data-id={idx}
                data-context="tab"
              >
                <p>{getCurrentDirName(item)}</p>
              </div>
            ))}
          </div>
          <ul
            className="tab-list"
            onMouseDown={(e) => {
              if (!e.target.closest(".file"))
                startDrag(e, settings.setDragBoxSize, settings.setSelectedFiles)
              else {
                startFileDrag(e, settings.setFileDraggingData, settingsRef)
              }
            }}
          >
            {tabs}
          </ul>
          <ul
            className="file-list-dragging"
            style={{
              position: "fixed",
              left: settings.fileDraggingData?.x,
              top: settings.fileDraggingData?.y,
              height: "fit-content"
            }}
          >
            {settings.selectedFiles.map((item, idx) => {
              if (settings.fileDraggingData)
                return (
                  <File
                    key={idx}
                    file={getSelectedEntry(
                      settings.tabFiles,
                      settings.tabPaths,
                      settings.activeTab,
                      item
                    )}
                    tabId={settings.activeTab}
                    drag={true}
                  />
                )
            })}
          </ul>
        </div>
      </div>
      <ContextMenu />
      <Toast />
      <Properties />
      <Drag settings={settings} />
    </SettingsContext.Provider>
  )
}

export default App
