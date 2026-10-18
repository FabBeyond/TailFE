import { createContext, useContext, useMemo, useState } from "react"

const UIContext = createContext(null)

export function UIProvider({ children }) {
  const [menu, setMenu] = useState(null)
  const [renaming, setRenaming] = useState(false)
  const [propertiesShown, setPropertiesShown] = useState(false)
  const [pathWriting, setPathWriting] = useState(false)
  const [insertMode, setInsertMode] = useState(false)
  const [kbdSearchLet, setKdbSearchLet] = useState("")

  const value = useMemo(
    () => ({
      menu,
      setMenu,
      renaming,
      setRenaming,
      propertiesShown,
      setPropertiesShown,
      pathWriting,
      setPathWriting,
      insertMode,
      setInsertMode,
      kbdSearchLet,
      setKdbSearchLet
    }),
    [menu, renaming, propertiesShown, pathWriting, insertMode, kbdSearchLet]
  )

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export const useUI = () => useContext(UIContext)
