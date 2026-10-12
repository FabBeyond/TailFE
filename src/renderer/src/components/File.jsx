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
    selectedFile,
    setSelectedFile,
    renaming,
    setRenaming,
    setRefreshToken
  } = useContext(SettingsContext)

  if (!showDotFiles && file.name.startsWith(".")) return null

  const path = concatPath(tabPaths[tabId], file.name)

  return (
    <div
      className={`file ${selectedFile === path ? "selected" : ""}`}
      data-path={path}
      data-is-directory={file.isDirectory}
    >
      <button
        style={{ fontSize: mainZoom }}
        onClick={() => {
          setSelectedFile(path)
        }}
        onDoubleClick={async () => {
          if (file.isDirectory) {
            changeTabPath(setTabPaths, tabId, concatPath(tabPaths[tabId], file.name))
          } else {
            await openFile(path)
          }
        }}
      >
        <div className="file-name" style={{ width: columnWidths.nameCol }}>
          {file.isDirectory ? <FolderIcon /> : <FileTextIcon />}
          {renaming && selectedFile === path ? (
            <RenameInput
              initialName={file.name}
              onSubmit={async (name) => {
                if (name && name !== file.name) {
                  await rename(path, concatPath(tabPaths[tabId], name), setRefreshToken)
                }
                setRenaming(false)
                setSelectedFile(concatPath(tabPaths[tabId], name))
              }}
              onCancel={() => setRenaming(false)}
            />
          ) : (
            <p>{file.name}</p>
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

export default File
