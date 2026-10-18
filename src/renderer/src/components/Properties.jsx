import { useTabs } from "../hooks/useTabs"
import { useUI } from "../hooks/useUI"
import { FileIcon, FolderIcon } from "lucide-react"

function Properties() {
  const { propertiesShown, setPropertiesShown } = useUI()
  const { activeTab, selectedFiles, getSelectedEntry } = useTabs()

  if (!propertiesShown) return

  const file = getSelectedEntry(activeTab, selectedFiles[0])

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
