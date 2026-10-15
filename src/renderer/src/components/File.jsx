import { useContext, useState } from "react"
import { SettingsContext } from "../hooks/useSettings"
import { concatPath, changeTabPath } from "../utils/paths"
import { FileTextIcon, FolderIcon } from "lucide-react"
import { timeAgo } from "../utils/timeAgo"
import { rename, openFile } from "../utils/fileActions.js"
import { bytesToReadable } from "../utils/fileUtils.js"

function RenameInput({ initialName, onSubmit, onCancel }) {
  const [name, setName] = useState(initialName)

  return (
    <input
      type="text"
      autoFocus
      className="rename-input"
      value={name}
      onChange={(e) => setName(e.target.value)}
      onDoubleClick={(e) => e.stopPropagation()}
      onBlur={onCancel}
      onKeyUp={(e) => {
        if (e.key === "Enter") onSubmit(name)
        else if (e.key === "Escape") onCancel()
      }}
    />
  )
}

function File({ file, tabId }) {
  const {
    showDotFiles,
    tabPaths,
    setTabPaths,
    mainZoom,
    columnWidths,
    selectedFiles,
    setSelectedFiles,
    renaming,
    setRenaming,
    setRefreshToken,
    insertMode,
    kbdSearchLet
  } = useContext(SettingsContext)

  if (!showDotFiles && file.name.startsWith(".")) return null

  const path = concatPath(tabPaths[tabId], file.name)

  return (
    <div
      className={`file ${selectedFiles.includes(path) ? "selected" : ""}`}
      data-context="file"
      data-id={path}
      data-is-directory={file.isDirectory}
      onClick={() => {
        setSelectedFiles([path])
      }}
      onDoubleClick={async () => {
        if (file.isDirectory) {
          changeTabPath(setTabPaths, tabId, concatPath(tabPaths[tabId], file.name))
        } else {
          await openFile(path)
        }
      }}
    >
      <button style={{ fontSize: mainZoom }}>
        <div className="file-name" style={{ width: columnWidths.nameCol }}>
          {file.isDirectory ? <FolderIcon /> : <FileTextIcon />}
          {renaming && selectedFiles.length === 1 && selectedFiles[0] === path ? (
            <RenameInput
              initialName={file.name}
              onSubmit={async (name) => {
                if (name && name !== file.name) {
                  await rename(path, concatPath(tabPaths[tabId], name), setRefreshToken)
                }
                setRenaming(false)
                setSelectedFiles([concatPath(tabPaths[tabId], name)])
              }}
              onCancel={() => setRenaming(false)}
            />
          ) : (
            <HighlightedName name={file.name} typed={insertMode ? kbdSearchLet : ""} />
          )}
        </div>
        <div className="file-size" style={{ width: columnWidths.sizeCol }}>
          {!file.isDirectory && <p>{bytesToReadable(file.size)}</p>}
        </div>
        <div className="file-last-modified">
          <p>{timeAgo.format(file.lastModified)}</p>
        </div>
      </button>
    </div>
  )
}
function HighlightedName({ name, typed }) {
  if (!typed || !name.startsWith(typed)) {
    return <p>{name}</p>
  }
  return (
    <p>
      <span className="insert-typed">{name.slice(0, typed.length)}</span>
      {name.slice(typed.length)}
    </p>
  )
}

export default File
