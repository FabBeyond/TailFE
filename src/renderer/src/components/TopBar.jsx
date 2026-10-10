import { useContext, useState } from "react"
import { SettingsContext } from "../hooks/useSettings"
import { changeTabPath, isValidPath } from "../utils/paths"

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
          isValidPath(e.target.value).then((valid) => {
            if (!valid) {
              e.target.value = tabPaths[activeTab]
              e.target.blur()
            } else {
              changeTabPath(setTabPaths, activeTab, e.target.value)
              e.target.blur()
            }
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
