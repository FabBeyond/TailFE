import { Fragment, useState } from "react"
import { useTabs } from "../hooks/useTabs"
import { useUI } from "../hooks/useUI"
import { removeLastPathElement, pathParts } from "../utils/paths"
import { ChevronLeftIcon, ChevronRightIcon, ArrowUp, SettingsIcon } from "lucide-react"

function AddressInput({ initialPath, activeTab, setPathWriting, navigate }) {
  const [tempPath, setTempPath] = useState(initialPath)

  return (
    <input
      className="address-bar"
      type="text"
      value={tempPath}
      autoFocus
      onChange={(e) => {
        setTempPath(e.target.value)
      }}
      onKeyUp={(e) => {
        if (e.key === "Enter") {
          const input = e.target
          navigate(activeTab, tempPath).then(() => input.blur())
        } else if (e.key === "Escape") {
          e.target.blur()
        }
      }}
      onBlur={() => {
        setPathWriting(false)
      }}
    />
  )
}
function AddressBarPart({ label, fullPath }) {
  const { navigate, activeTab } = useTabs()
  return (
    <button
      className="address-bar-part"
      onClick={(e) => {
        e.stopPropagation()
        navigate(activeTab, fullPath)
      }}
    >
      {label}
    </button>
  )
}
function SlashSeparator() {
  return (
    <div className="slash-separator">
      <p>/</p>
    </div>
  )
}

function TopBar() {
  const { activeTab, moveInHistory, getPath, canMoveHistory, navigate } = useTabs()
  const { insertMode, pathWriting, setPathWriting, setSettingsOpen } = useUI()
  const splitPaths = pathParts(getPath(activeTab))
  const historyMove = canMoveHistory(activeTab)

  return (
    <div className="top-bar">
      <ChevronLeftIcon
        className={historyMove.backwards ? "" : "disabled"}
        onClick={() => moveInHistory(activeTab, -1)}
      />
      <ChevronRightIcon
        className={historyMove.forwards ? "" : "disabled"}
        onClick={() => moveInHistory(activeTab, 1)}
      />
      <ArrowUp
        className={splitPaths.length != 0 ? "" : "disabled"}
        onClick={() => {
          navigate(activeTab, removeLastPathElement(getPath(activeTab)))
        }}
      />
      {!pathWriting ? (
        <div
          className="address-bar"
          onClick={() => {
            setPathWriting(true)
          }}
        >
          {splitPaths.length == 0 && <SlashSeparator />}
          {splitPaths.map((item) => (
            <Fragment key={item.path}>
              <SlashSeparator />
              <AddressBarPart label={item.label} fullPath={item.path} />
            </Fragment>
          ))}
        </div>
      ) : (
        <AddressInput
          key={`${activeTab}-${getPath(activeTab)}`}
          initialPath={getPath(activeTab)}
          activeTab={activeTab}
          navigate={navigate}
          setPathWriting={setPathWriting}
        />
      )}
      <div className="mode-indicator">
        <p>{insertMode ? "INSERT" : "NORMAL"}</p>
      </div>
      <SettingsIcon onClick={() => setSettingsOpen(true)} />
    </div>
  )
}

export default TopBar
