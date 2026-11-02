import { removeLastPathElement, concatPath } from "./paths"

const NORMAL_KEYS = {
  i: ({ setInsertMode }) => setInsertMode(true),
  I: ({ setPathWriting }) => setPathWriting(true),
  ",": ({ updateSetting }) => updateSetting("mainZoom", (prev) => prev - 2),
  ".": ({ updateSetting }) => updateSetting("mainZoom", (prev) => prev + 2),
  "<": ({ moveInHistory, activeTab }) => moveInHistory(activeTab, -1),
  ">": ({ moveInHistory, activeTab }) => moveInHistory(activeTab, 1),
  F2: ({ selectedFiles, setRenaming }) => {
    if (selectedFiles.length === 1) setRenaming(true)
  },
  j: (states) => states.moveSelection(1),
  k: (states) => states.moveSelection(-1),
  Enter: ({ navigate, activeTab, selectedFiles }) => {
    navigate(activeTab, selectedFiles[0])
  }
}

const INSERT_KEYS = {
  Escape: ({ setInsertMode, setKdbSearchLet }) => {
    setInsertMode(false)
    setKdbSearchLet("")
  },
  Backspace: ({ kbdSearchLet, setKdbSearchLet }) => setKdbSearchLet(kbdSearchLet.slice(0, -1)),
  Enter: ({ kbdSearchLet, setKdbSearchLet, setInsertMode, activeTab, getPath, navigate }) => {
    if (kbdSearchLet === "") return

    let newPath = getPath(activeTab)
    if (/^\.+$/.test(kbdSearchLet)) {
      for (let i = 0; i < kbdSearchLet.length; i++) {
        newPath = removeLastPathElement(newPath)
      }
    } else {
      newPath = concatPath(newPath, kbdSearchLet)
      setInsertMode(false)
    }
    navigate(activeTab, newPath)
    setKdbSearchLet("")
  }
}

export function handleKeybinds(e, states) {
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return
  if (e.ctrlKey || e.altKey || e.metaKey) return
  const { insertMode, kbdSearchLet, setKdbSearchLet } = states

  const action = (insertMode ? INSERT_KEYS : NORMAL_KEYS)[e.key]
  if (action) {
    e.preventDefault()
    action(states)
  } else if (insertMode && e.key.length === 1) {
    setKdbSearchLet(kbdSearchLet + e.key)
  }
}
