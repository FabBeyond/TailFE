import { useEffect, useState } from "react"
import { useTabs } from "../hooks/useTabs"
import { useUI } from "../hooks/useUI"
import { FileIcon, FolderIcon, XIcon, CopyIcon, CheckIcon } from "lucide-react"
import { timeAgo } from "../utils/timeAgo"
import { bytesToReadable } from "../utils/fileUtils"

const PROPERTIES = [
  {
    Name: "Location",
    Copy: true,
    Data: (_, path) => path
  },
  {
    Name: "Contents",
    Copy: false,
    Load: async (_, path) => {
      const result = await window.api.readDir(path)
      if (result.error) throw ""
      return result.length
    }
  },
  {
    Name: "Size",
    Copy: false,
    Data: (file) => (file.isDirectory ? "None" : bytesToReadable(file.size))
  },
  {
    Name: "Last Modified",
    Copy: false,
    Data: (file) => timeAgo.format(file.lastModified)
  }
]

function Property({ item, file, path }) {
  const [loaded, setLoaded] = useState(null)
  const [copyActive, setCopyActive] = useState(true)

  useEffect(() => {
    if (!item.Load) return
    let stale = false

    //eslint-disable-next-line
    setLoaded(null)
    item
      .Load(file, path)
      .catch(() => "Unknown")
      .then((value) => {
        if (!stale) setLoaded(value)
      })

    return () => {
      stale = true
    }
  }, [file, item, path])

  const value = item.Load ? (loaded ?? "Loading...") : item.Data(file, path)

  return (
    <div className="property">
      <p className="property-label">{item.Name}</p>
      <p className="property-value">{value}</p>
      {item.Copy && (
        <div
          className="property-copy-button"
          onClick={async () => {
            setCopyActive(false)
            setTimeout(() => {
              setCopyActive(true)
            }, 2000)
          }}
        >
          {copyActive ? <CopyIcon /> : <CheckIcon />}
        </div>
      )}
    </div>
  )
}

function Properties() {
  const { propertiesShown, setPropertiesShown } = useUI()
  const { activeTab, selectedFiles, getSelectedEntry } = useTabs()

  const path = selectedFiles[0]
  const file = getSelectedEntry(activeTab, path)

  if (!propertiesShown || !file) return null

  return (
    <div
      className="properties-blocker"

      onClick={() => setPropertiesShown(false)}
      style={{
        display: propertiesShown ? "block" : "none",
        pointerEvents: propertiesShown ? "auto" : "none"
      }}
    >
      <div className="modal properties-container" onClick={(e) => e.stopPropagation()}>
        <XIcon onClick={() => setPropertiesShown(false)} className="close-button" />
        <div className="top-part">
          <div className="properties-icon">{file.isDirectory ? <FolderIcon /> : <FileIcon />}</div>
          <div className="properties-top-infos">
            <p className="properties-name">{file.name}</p>
            <p className="properties-type">{file.isDirectory ? "Folder" : "File"}</p>
          </div>
        </div>
        <div className="properties-infos">
          {PROPERTIES.map((item) => (
            <Property key={item.Name} item={item} file={file} path={path} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Properties
