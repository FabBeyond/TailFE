import { createContext, useCallback, useContext, useMemo, useState } from "react"

const SettingsContext = createContext(null)
const DEFAULT_SETTINGS = {
  showDotFiles: false,
  mainZoom: 20,
  columnWidths: { nameCol: 300, sizeCol: 150 },
  sidebarWidth: 200,
  foldersOnTop: true,
  dragDeadzone: 20,
  sortingMode: { key: "name", desc: false }
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: typeof value === "function" ? value(prev[key]) : value
    }))
  }, [])

  const value = useMemo(
    () => ({
      ...settings,
      updateSetting
    }),
    [settings, updateSetting]
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

//eslint-disable-next-line
export const useSettings = () => useContext(SettingsContext)
