import { useContext, useState } from "react"
import { SettingsContext } from "../hooks/useSettings"
import { concatPath, changeTabPath } from "../utils/paths"
import { icons } from "../utils/icons"
import { timeAgo } from "../utils/timeAgo"

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
      className="file"
      style={{ backgroundColor: selectedFile === path ? "#FF0000" : "transparent" }}
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
            const result = await window.api.openFile(path)
            console.log(result)
            if (result.noProgram) {
              console.log("no program")
            }
          }
        }}
      >
        <div className="file-name" style={{ width: columnWidths.nameCol }}>
          {file.isDirectory ? (
            <img src={icons["folder-icon.png"]} alt="folder-icon" />
          ) : (
            <img src={icons["file-icon.png"]} alt="file-icon" />
          )}
          {renaming && selectedFile === path ? (
            <RenameInput
              initialName={file.name}
              onSubmit={async (name) => {
                if (name && name !== file.name) {
                  await window.api.rename(path, concatPath(tabPaths[tabId], name))
                  setRefreshToken((t) => t + 1)
                }
                setRenaming(false)
              }}
              onCancel={() => setRenaming(false)}
            />
          ) : (
            <p>{file.name}</p>
          )}
        </div>
        <div className="file-size" style={{ width: columnWidths.sizeCol }}>
          {!file.isDirectory && <p>{file.size} bytes</p>}
        </div>
        <div className="file-last-modified">
          <p>{timeAgo.format(file.lastModified)}</p>
        </div>
      </button>
    </div>
  )
}

export default File
