import { useContext } from "react"
import { SettingsContext } from "../hooks/useSettings.js"
import { FileIcon, FolderIcon } from "lucide-react"
import { getSelectedEntry } from "../utils/paths.js"

function Properties() {
  const { propertiesShown, setPropertiesShown, tabFiles, tabPaths, activeTab, selectedFile } =
    useContext(SettingsContext)

  if (!propertiesShown) return

  const file = getSelectedEntry(tabFiles, tabPaths, activeTab, selectedFile)

  return (
    <div
      className="properties-blocker"

      onClick={() => {
        setPropertiesShown(false)
      }}
      style={{
        display: propertiesShown ? "block" : "none",
        pointerEvents: propertiesShown ? "auto" : "none"
      }}
    >
      <div className="properties-container" onClick={(e) => e.stopPropagation()}>
        {file.isDirectory ? <FolderIcon /> : <FileIcon />}
        <p className="properties-name">{file.name}</p>
      </div>
    </div>
  )
}

export default Properties
