import { useEffect, useRef, useState } from "react"
import { useSettings } from "./hooks/useSettings"
import { useTabs } from "./hooks/useTabs"
import { useUI } from "./hooks/useUI"
import { concatPath, getCurrentDirName, removeLastPathElement } from "./utils/paths"
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
    setMainZoom,
    setRenaming,
    activeTab,
    getPath,
    navigate,
    selectedFiles,
    moveInHistory
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
      if (e.key === "Backspace") {
        return prev.slice(0, -1)
      }
      if (e.key === "Enter") {
        if (prev.startsWith(".")) {
          let newPath = getPath(activeTab)
          for (let i = 0; i < prev.length; i++) {
            newPath = removeLastPathElement(newPath)
          }
          navigate(activeTab, newPath)
          return ""
        }
        navigate(activeTab, concatPath(getPath(activeTab), prev))
        setInsertMode(false)
        return ""
      }

      if (e.key.length !== 1) return prev
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
      moveInHistory(activeTab, -1)
    } else if (e.key === ">") {
      moveInHistory(activeTab, 1)
    } else if (e.key === "F2") {
      if (selectedFiles.length === 1) setRenaming(true)
    }
  }
}

function App() {
  const [isFileDragging, setIsFileDragging] = useState(false)

  const settings = useSettings()
  const usedTabs = useTabs()
  const ui = useUI()
  const { activeTab, setActiveTab, selectedFiles, setSelectedFiles, getSelectedEntry, tabs } =
    usedTabs
  const { setMenu } = ui

  // merged view of all contexts for window listeners and drag handlers
  const settingsRef = useRef({ ...settings, ...usedTabs, ...ui })
  const dragBoxRef = useRef(null)
  const dragPreviewRef = useRef(null)

  useEffect(() => {
    settingsRef.current = { ...settings, ...usedTabs, ...ui }
  })

  useEffect(() => {
    const listener = (e) => handleKeyDown(e, settingsRef.current)
    window.addEventListener("keydown", listener)
    return () => window.removeEventListener("keydown", listener)
  }, [])

  const tabElements = tabs.map((tab) => (
    <Tab key={tab.id} path={tab.path} loadedPath={tab.loadedPath} tabId={tab.id} />
  ))

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
    <>
      <TopBar />
      <div className="bottom-part">
        <Sidebar />
        <div className="tabs">
          <div className="tab-headers">
            {tabs.map((item) => (
              <div
                key={item.id}
                className="tab-header"
                onClick={() => {
                  setActiveTab(item.id)
                }}
                style={{
                  backgroundColor:
                    activeTab == item.id ? "var(--accent-faded)" : "var(--bars-colors)"
                }}
                data-id={item.id}
                data-context="tab"
              >
                <p>{getCurrentDirName(item.path)}</p>
              </div>
            ))}
          </div>
          <ul
            className="tab-list"
            onMouseDown={(e) => {
              if (!e.target.closest(".file")) startDrag(e, dragBoxRef.current, setSelectedFiles)
              else {
                startFileDrag(e, setIsFileDragging, dragPreviewRef.current, settingsRef)
              }
            }}
          >
            {tabElements}
          </ul>
          <ul
            className="file-list-dragging"
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              height: "fit-content"
            }}
            ref={dragPreviewRef}
          >
            {selectedFiles.map((item, idx) => {
              if (isFileDragging)
                return (
                  <File
                    key={idx}
                    file={getSelectedEntry(activeTab, item)}
                    tabId={activeTab}
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
      <div
        className="drag-box"
        ref={dragBoxRef}
        style={{ position: "fixed", display: "none" }}
      ></div>
    </>
  )
}

export default App
