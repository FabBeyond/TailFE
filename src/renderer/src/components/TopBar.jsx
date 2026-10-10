import { useContext, useState } from "react"
import { SettingsContext } from "../hooks/useSettings"
import { changeTabPath } from "../utils/paths"
import { showToast, errorMessage } from "../utils/toast.js"

function AddressInput({ initialPath, activeTab, tabPaths, setTabPaths }) {
  const [tempPath, setTempPath] = useState(initialPath)

  return (
    <input
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
  const { tabPaths, setTabPaths, activeTab } = useContext(SettingsContext)

  return (
    <AddressInput
      key={`${activeTab}-${tabPaths[activeTab]}`}
      initialPath={tabPaths[activeTab]}
      activeTab={activeTab}
      tabPaths={tabPaths}
      setTabPaths={setTabPaths}
    />
  )
}

export default TopBar
