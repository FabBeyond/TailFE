import { useContext, useState } from "react"
import { SettingsContext } from "../hooks/useSettings"
import { changeTabPath } from "../utils/paths"
import { showToast, errorMessage } from "../utils/toast.js"
import { ChevronLeftIcon, ChevronRightIcon, ArrowUp } from "lucide-react"

function AddressInput({ initialPath, activeTab, tabPaths, setTabPaths }) {
  const [tempPath, setTempPath] = useState(initialPath)

  return (
    <input
      className="address-bar"
      type="text"
      value={tempPath}
      onChange={(e) => {
        setTempPath(e.target.value)
      }}
      onKeyUp={(e) => {
        if (e.key === "Enter") {
          const input = e.target
          window.api.readDir(tempPath).then((result) => {
            if (result.error) {
              showToast("Can't open folder", `${tempPath}: ${errorMessage(result.error)}`, "error")
              setTempPath(tabPaths[activeTab])
            } else {
              changeTabPath(setTabPaths, activeTab, tempPath)
            }
            input.blur()
          })
        }
      }}
    />
  )
}

function TopBar() {
  const { tabPaths, setTabPaths, activeTab, insertMode } = useContext(SettingsContext)

  return (
    <div className="top-bar">
      <ChevronLeftIcon />
      <ChevronRightIcon />
      <ArrowUp />
      <AddressInput
        key={`${activeTab}-${tabPaths[activeTab]}`}
        initialPath={tabPaths[activeTab]}
        activeTab={activeTab}
        tabPaths={tabPaths}
        setTabPaths={setTabPaths}
      />
      <div className="mode-indicator">
        <p>{insertMode ? "INSERT" : "NORMAL"}</p>
      </div>
    </div>
  )
}

export default TopBar
