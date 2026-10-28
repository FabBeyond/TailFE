import { Fragment, useState } from "react"
import { useTabs } from "../hooks/useTabs"
import { useUI } from "../hooks/useUI"
import { removeLastPathElement } from "../utils/paths"
import { ChevronLeftIcon, ChevronRightIcon, ArrowUp } from "lucide-react"

function AddressInput({ initialPath, activeTab, setPathWriting, getPath, navigate }) {
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
          navigate(activeTab, tempPath).then((ok) => {
            if (!ok) setTempPath(getPath(activeTab))
            input.blur()
          })
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
function AddressBarPart({ part, splitPaths, idx, activeTab, navigate }) {
  return (
    <button
      className="address-bar-part"
      onClick={(e) => {
        e.stopPropagation()
        let fullPath = "/" + splitPaths.slice(0, idx + 1).join("/")
        navigate(activeTab, fullPath)
      }}
    >
      {part}
    </button>
  )
}
function SlashSeperator() {
  return (
    <div className="slash-seperator">
      <p>/</p>
    </div>
  )
}

function TopBar() {
  const { activeTab, moveInHistory, getPath, canMoveHistory, navigate } = useTabs()
  const { insertMode, pathWriting, setPathWriting } = useUI()
  let splitPaths = getPath(activeTab).split("/")
  splitPaths = splitPaths.filter((item) => item !== "")

  return (
    <div className="top-bar">
      <ChevronLeftIcon
        style={{
          color: canMoveHistory(activeTab).backwards ? "var(--text-color)" : "var(--text-muted)"
        }}
        onClick={() => moveInHistory(activeTab, -1)}
      />
      <ChevronRightIcon
        style={{
          color: canMoveHistory(activeTab).forwards ? "var(--text-color)" : "var(--text-muted)"
        }}
        onClick={() => moveInHistory(activeTab, 1)}
      />
      <ArrowUp
        style={{ color: splitPaths.length != 0 ? "var(--text-color)" : "var(--text-muted)" }}
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
          {splitPaths.length == 0 ? <SlashSeperator></SlashSeperator> : <></>}
          {splitPaths.map((item, idx) => (
            <Fragment key={idx}>
              <SlashSeperator />
              <AddressBarPart
                part={item}
                splitPaths={splitPaths}
                idx={idx}
                activeTab={activeTab}
                navigate={navigate}
              />
            </Fragment>
          ))}
        </div>
      ) : (
        <AddressInput
          key={`${activeTab}-${getPath(activeTab)}`}
          initialPath={getPath(activeTab)}
          activeTab={activeTab}
          navigate={navigate}
          getPath={getPath}
          setPathWriting={setPathWriting}
        />
      )}
      <div className="mode-indicator">
        <p>{insertMode ? "INSERT" : "NORMAL"}</p>
      </div>
    </div>
  )
}

export default TopBar
