import { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from "react"

const SettingsContext = createContext(null)
const DEFAULT_SETTINGS = {
  showDotFiles: false,
  darkenDotFiles: true,
  mainZoom: 20,
  columnWidths: { nameCol: 300, sizeCol: 150 },
  sidebarWidth: 200,
  foldersOnTop: true,
  dragDeadzone: 20,
  sortingMode: { key: "name", desc: false },
  showDeleteConfirmation: true
}

function mergeSettings(saved = {}) {
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    columnWidths: { ...DEFAULT_SETTINGS.columnWidths, ...saved.columnWidths },
    sortingMode: { ...DEFAULT_SETTINGS.sortingMode, ...saved.sortingMode }
  }
}

export function SettingsProvider({ children, initialSettings }) {
  const [settings, setSettings] = useState(() => mergeSettings(initialSettings))
  const lastSaved = useRef(settings)

  useEffect(() => {
    if (settings === lastSaved.current) return

    const save = () => {
      lastSaved.current = settings
      window.api.saveSettings(settings)
    }
    const timer = setTimeout(save, 300)
    window.addEventListener("pagehide", save)
    return () => {
      clearTimeout(timer)
      window.removeEventListener("pagehide", save)
    }
  })

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: typeof value === "function" ? value(prev[key]) : value
    }))
  }, [])

  const value = useMemo(
    () => ({
      ...settings,
      DEFAULT_SETTINGS,
      updateSetting
    }),
    [settings, updateSetting]
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

//eslint-disable-next-line
export const useSettings = () => useContext(SettingsContext)
