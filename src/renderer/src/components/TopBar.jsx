import { useContext, useEffect, useState } from 'react'
import { SettingsContext } from '../hooks/useSettings'
import { changeTabPath, isValidPath } from '../utils/paths'

function TopBar() {
  const {tabPaths, setTabPaths, activeTab} = useContext(SettingsContext)
  const [tempPath, setTempPath] = useState(tabPaths[activeTab])

  useEffect(() => {
    setTempPath(tabPaths[activeTab])
  }, [tabPaths])

  return (
    <input type="text" value={tempPath} onChange={(e) => {
      setTempPath(e.target.value)
    }} onKeyUp={(e) => {
      if (e.key === "Enter") {
        isValidPath(e.target.value).then(valid => {
          if (!valid) {
            e.target.value = tabPaths[activeTab]
            e.target.blur()
          }
          else {
            changeTabPath(setTabPaths, activeTab, e.target.value)
            e.target.blur()
          }
        })
      }
    }}/>
  )
}

export default TopBar
