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
import { sortFiles } from "./utils/fileUtils.js"

const NORMAL_KEYS = {
  // make Shift+i super insert mode where you type the full path
  i: ({ setInsertMode }) => setInsertMode(true),
  ",": ({ setMainZoom }) => setMainZoom((prev) => prev - 2),
  ".": ({ setMainZoom }) => setMainZoom((prev) => prev + 2),
  "<": ({ moveInHistory, activeTab }) => moveInHistory(activeTab, -1),
  ">": ({ moveInHistory, activeTab }) => moveInHistory(activeTab, 1),
  F2: ({ selectedFiles, setRenaming }) => {
    if (selectedFiles.length === 1) setRenaming(true)
  }
}

const INSERT_KEYS = {
  Escape: ({ setInsertMode, setKdbSearchLet }) => {
    setInsertMode(false)
    setKdbSearchLet("")
  },
  Backspace: ({ kbdSearchLet, setKdbSearchLet }) => setKdbSearchLet(kbdSearchLet.slice(0, -1)),
  Enter: ({ kbdSearchLet, setKdbSearchLet, setInsertMode, activeTab, getPath, navigate }) => {
    if (kbdSearchLet === "") return

    let newPath = getPath(activeTab)
    if (/^\.+$/.test(kbdSearchLet)) {
      for (let i = 0; i < kbdSearchLet.length; i++) {
        newPath = removeLastPathElement(newPath)
      }
    } else {
      newPath = concatPath(newPath, kbdSearchLet)
      setInsertMode(false)
    }
    navigate(activeTab, newPath)
    setKdbSearchLet("")
  }
}

function handleKeyDown(e, states) {
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return
  if (e.ctrlKey || e.altKey || e.metaKey) return
  const { insertMode, kbdSearchLet, setKdbSearchLet } = states

  const action = (insertMode ? INSERT_KEYS : NORMAL_KEYS)[e.key]
  if (action) {
    e.preventDefault()
    action(states)
  } else if (insertMode && e.key.length === 1) {
    setKdbSearchLet(kbdSearchLet + e.key)
  }
}

function App() {
  const [isFileDragging, setIsFileDragging] = useState(false)

  const settings = useSettings()
  const usedTabs = useTabs()
  const ui = useUI()
  const { sortingMode, foldersOnTop } = settings
  const {
    activeTab,
    setActiveTab,
    selectedFiles,
    getFiles,
    setSelectedFiles,
    getPath,
    tabs,
    getTab
  } = usedTabs
  const { setMenu } = ui

  // merged view of all contexts for window listeners and drag handlers
  const statesRef = useRef({ ...settings, ...usedTabs, ...ui })
  const dragBoxRef = useRef(null)
  const dragPreviewRef = useRef(null)

  useEffect(() => {
    statesRef.current = { ...settings, ...usedTabs, ...ui }
  })

  useEffect(() => {
    const listener = (e) => handleKeyDown(e, statesRef.current)
    window.addEventListener("keydown", listener)
    return () => window.removeEventListener("keydown", listener)
  }, [])

  const tabInfo = getTab(activeTab)
  const dir = getPath(activeTab)

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
          <div
            className="tab-list"
            onMouseDown={(e) => {
              if (!e.target.closest(".file")) startDrag(e, dragBoxRef.current, setSelectedFiles)
              else {
                startFileDrag(e, setIsFileDragging, dragPreviewRef.current, statesRef)
              }
            }}
          >
            <Tab key={tabInfo.id} path={tabInfo.path} tabId={tabInfo.id} />
          </div>
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
            {isFileDragging &&
              sortFiles(getFiles(activeTab), sortingMode, foldersOnTop)
                .filter((file) => selectedFiles.includes(concatPath(dir, file.name)))
                .map((item) => <File key={item.name} file={item} tabId={activeTab} />)}
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
