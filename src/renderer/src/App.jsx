import { createContext, useContext, useEffect, useRef, useState } from 'react'
import TimeAgo from "javascript-time-ago"
import en from "javascript-time-ago/locale/en"

const iconModules = import.meta.glob('./assets/resources/*.{png,svg,jpg}', {
  eager: true,
  import: 'default'
})
const icons = Object.fromEntries(
  Object.entries(iconModules).map(([path, url]) => [path.split('/').pop(), url])
)
const timeAgo = new TimeAgo("en")

function concatPath(path1, path2) {
  return `${path1}/${path2}`.replace(/\/+/g, '/')
}
function removeLastPathElement(path) {
  const lastIndex = path.lastIndexOf("/")
  return path.slice(0, lastIndex)
}
function changeTabPath(setTabPaths, tabId, newPath) {
  setTabPaths(prev => {
    const next = [...prev]
    next[tabId] = newPath
    return next
  })
}
function hasDirectories(files) {
  files = files.filter(file => (file.isDirectory))
  return files.length > 0
}
function readDirSafe(path, onSuccess) {
  window.api.readDir(path).then(result => {
    if (!result.error) onSuccess(result)
  })
}
function deleteFile(path, tabPaths, activeTab, setRefreshToken) {
  const result = window.api.deleteFile(path)
  if (!result.error) {
    setRefreshToken(1)
  }
  else {
    console.log(result.error)
  }
}
function isValidPath(path) {
  return window.api.readDir(path).then(result => !result.error)
}
function useSettings() {
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

  return {showDotFiles, setShowDotFiles, tabPaths, setTabPaths, insertMode, setInsertMode, kbdSearchLet, setKdbSearchLet,
    activeTab, setActiveTab, mainZoom, setMainZoom, columnWidths, setColumnWidths, history, setHistory, isHistoryChange,
    historyIndex, setHistoryIndex, menu, setMenu, refreshToken, setRefreshToken}
}

function handleKeyDown(e, settings) {
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return
  const {insertMode, setInsertMode, kbdSearchLet, setKdbSearchLet, activeTab, tabPaths, setTabPaths,
  mainZoom, setMainZoom, history, setHistory, historyIndex, setHistoryIndex} = settings

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
  }
}
function startResize(e, startWidth, onResize) {
  const startX = e.clientX

  function onMouseMove(moveEvent) {
    onResize(startWidth + (moveEvent.clientX - startX))
  }
  function onMouseUp() {
    window.removeEventListener("mousemove", onMouseMove)
    window.removeEventListener("mouseup", onMouseUp)
  }
  window.addEventListener("mousemove", onMouseMove)
  window.addEventListener("mouseup", onMouseUp)
}
function startColumnResize(e, columnWidths, setColumnWidths, column) {
  startResize(e, columnWidths[column], (newWidth) => {
    setColumnWidths(prev => ({...prev, [column]: newWidth}))
  })
}

const SettingsContext = createContext()

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
      setMenu({x: e.clientX, y: e.clientY, target: target?.dataset.path ?? null})
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
function TopBar() {
  const {tabPaths, setTabPaths, activeTab} = useContext(SettingsContext)
  const [tempPath, setTempPath] = useState(tabPaths[activeTab])

  useEffect(() => {
    setTempPath(tabPaths[activeTab])
  }, [tabPaths])

  return (
    <input type="text" value={tempPath} onChange={(e) => {
      setTempPath(e.target.value)
    }} onKeyUp={(e) => {
      if (e.key === "Enter") {
        isValidPath(e.target.value).then(valid => {
          if (!valid) {
            e.target.value = tabPaths[activeTab]
            e.target.blur()
          }
          else {
            changeTabPath(setTabPaths, activeTab, e.target.value)
            e.target.blur()
          }
        })
      }
    }}/>
  )
}
function Tab({path, tabId}) {
  const [files, setFiles] = useState([])
  const {mainZoom, columnWidths, setColumnWidths, history, setHistory,
    historyIndex, setHistoryIndex, isHistoryChange, refreshToken, setRefreshToken} = useContext(SettingsContext)

  const lastRecordedPath = useRef(null)

  useEffect(() => {
    readDirSafe(path, setFiles)
    setRefreshToken(0)
    if (isHistoryChange.current) {
      lastRecordedPath.current = path
      isHistoryChange.current = false
    }
    else if (lastRecordedPath.current !== path){
      lastRecordedPath.current = path
      setHistory(prev => [...prev.slice(0, historyIndex + 1), path])
      setHistoryIndex(i => i+1)
    }
  }, [path, refreshToken])

  const fileObjs = files.map(file => (
    <File key={file.name} file={file} tabId={tabId}/>
  ))
  return (
    <>
      <div className="files-headers" style={{fontSize: mainZoom}}>
        <p className="name" style={{width: columnWidths.nameCol}}>Name</p>
        <div className="resize-handle" onMouseDown={(e) => startColumnResize(e, columnWidths, setColumnWidths, "nameCol")}></div>
        <p className="size" style={{width: columnWidths.sizeCol}}>Size</p>
        <div className="resize-handle" onMouseDown={(e) => startColumnResize(e, columnWidths, setColumnWidths, "sizeCol")}></div>
        <p className="last-modified">Last Modified</p>
      </div>
      <ul className="file-list">
        {fileObjs}
      </ul>
    </>
  )
}
function File({file, tabId}) {
  const {showDotFiles, tick} = useContext(SettingsContext)
  const {tabPaths, setTabPaths, mainZoom, columnWidths, setColumnWidths} = useContext(SettingsContext)

  if (!showDotFiles && file.name.startsWith(".")) return

  return (
    <div className="file" data-path={concatPath(tabPaths[tabId], file.name)}>
      <button style={{fontSize: mainZoom}} onClick={() => {
        changeTabPath(setTabPaths, tabId, concatPath(tabPaths[tabId], file.name))
      }}>
        <div className="file-name" style={{width: columnWidths.nameCol}}>
          {file.isDirectory ? (
            <img src={icons["folder-icon.png"]} alt="folder-icon"/>
          ) : (
            <img src={icons["file-icon.png"]} alt="file-icon"/>
          )}
          <p>{file.name}</p>
        </div>
        <div className="file-size" style={{width: columnWidths.sizeCol}}>
          {!file.isDirectory &&
            <p>{file.size} bytes</p>
          }
        </div>
        <div className="file-last-modified">
          <p>{timeAgo.format(file.lastModified)}</p>
        </div>
      </button>
    </div>
  )
}
function RootFolderList({files, curPath}) {
  files = files.filter(files => (files.isDirectory))

  return (
    <ul className="folder-list">
      <FLFolder folderName={{name: "/", isDirectory: true}} curPath="/"/>
    </ul>
  )
}
function FolderList({files, curPath}) {
  files = files.filter(file => (file.isDirectory))
  const flFolders = files.map(file => (
    <FLFolder key={file.name} folderName={file} curPath={curPath}/>
  ))

  return (
    <ul className="folder-list">
      {flFolders}
    </ul>
  )
}
function FLFolder({folderName, curPath}) {
  const [open, setOpen] = useState(false)
  const [children, setChildren] = useState([])
  const {showDotFiles, activeTab, setTabPaths} = useContext(SettingsContext)

  if (!showDotFiles && folderName.name.startsWith(".")) return

  useEffect(() => {
    readDirSafe(concatPath(curPath, folderName.name), setChildren)
  }, [])

  useEffect(() => {
    if (open) {
      readDirSafe(concatPath(curPath, folderName.name), setChildren)
    }
  }, [open])

  return (
    <div className="fl-folder">
      <div className="fl-folder-content">
        <button className={`${open ? "arrow-open" : ""} ${!hasDirectories(children) ? "hide" : ""}`} onClick={() => {
          const next = !open
          setOpen(next)
        }}>
          <img src={icons["arrow-icon.png"]}/>
        </button>
        <img src={icons["folder-icon.png"]} alt="folder icon"/>
        <button onClick={() => changeTabPath(setTabPaths, activeTab, concatPath(curPath, folderName.name))}>
          <p>{folderName.name}</p>
        </button>
      </div>
      {open && <FolderList files={children} curPath={concatPath(curPath, folderName.name)}/>}
    </div>
  )
}
function ContextMenu() {
  const {menu, setMenu, tabPaths, activeTab, setRefreshToken} = useContext(SettingsContext)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menu) return
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenu(null)
      }
    }
    window.addEventListener("click", onClick)
    return () => window.removeEventListener("click", onClick)
  }, [menu])

  return (
    (menu && <div className="context-menu" ref={menuRef} style={{left: menu.x, top: menu.y}}>
      <ul>
        {menu.target &&
          <li><button onClick={() => {
            deleteFile(menu.target, tabPaths, activeTab, setRefreshToken)
          }}>Delete</button></li>
        }
        <li><button onClick={() => {
          window.api.createFolder(concatPath(tabPaths[activeTab], "NewFolder"))
          setRefreshToken(1)
        }}>New Folder</button>
        </li>
      </ul>
    </div>
    )
  )
}

export default App
