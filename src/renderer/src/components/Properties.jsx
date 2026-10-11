import { useContext } from "react"
import { SettingsContext } from "../hooks/useSettings.js"
import { icons } from "../utils/icons"
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
        {file.isDirectory ? (
          <img src={icons["folder-icon.png"]} alt="folder-icon" />
        ) : (
          <img src={icons["file-icon.png"]} alt="file-icon" />
        )}
        <p className="properties-name">{file.name}</p>
      </div>
    </div>
  )
}

export default Properties
