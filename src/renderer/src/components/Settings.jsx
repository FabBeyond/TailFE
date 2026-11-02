import { useEffect, useState } from "react"
import { PlusIcon, MinusIcon, XIcon } from "lucide-react"
import { useSettings } from "../hooks/useSettings"
import { useUI } from "../hooks/useUI"

const settingsSchema = [
  {
    id: "general",
    label: "General",
    settings: [
      { key: "showDotFiles", label: "Show hidden files", type: "toggle" },
      { key: "foldersOnTop", label: "Folders on top", type: "toggle" }
    ]
  },
  {
    id: "behaviour",
    label: "Behaviour",
    settings: [{ key: "dragDeadzone", label: "Drag deadzone", type: "number", min: 0, unit: "px" }]
  }
]
const controls = { toggle: ToggleControl, number: NumberControl }

function Settings() {
  const { setSettingsOpen, settingsOpen } = useUI()
  const [activeId, setActiveId] = useState(settingsSchema[0].id)
  const active = settingsSchema.find((c) => c.id === activeId)

  return (
    <div
      className="properties-blocker"
      onClick={() => setSettingsOpen(false)}
      style={{
        display: settingsOpen ? "block" : "none",
        pointerEvents: settingsOpen ? "auto" : "none"
      }}
    >
      <div>
        <div className="settings" onClick={(e) => e.stopPropagation()}>
          <XIcon onClick={() => setSettingsOpen(false)} className="close-button" />
          <div className="categories">
            {settingsSchema.map((item) => (
              <p key={item.id} onClick={() => setActiveId(item.id)}>
                {item.label}
              </p>
            ))}
          </div>
          <div className="settings-content">
            {active.settings.map((item) => (
              <SettingsRow key={item.key} setting={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingsRow({ setting }) {
  const Control = controls[setting.type]

  return (
    <div className="settings-row">
      <p className="setting-label">{setting.label}</p>
      <Control setting={setting} />
    </div>
  )
}

function ToggleControl({ setting }) {
  return <div></div>
}
function NumberControl({ setting }) {
  const settings = useSettings()
  const { updateSetting } = settings
  const [tempValue, setTempValue] = useState(settings[setting.key])

  const min = setting.min ?? -Infinity
  const max = setting.max ?? Infinity

  useEffect(() => {
    updateSetting(setting.key, tempValue)
  }, [tempValue, setting.key, updateSetting])

  return (
    <div className="number-control">
      <button
        className="nc-left"
        onClick={() => {
          setTempValue(Math.max(min, Math.min(tempValue - 1, max)))
        }}
      >
        <MinusIcon />
      </button>
      <input
        type="text"
        className="nc-middle"
        value={tempValue}
        onChange={(e) => {
          const newValue = Number(e.target.value)
          if (isNaN(newValue)) return
          setTempValue(newValue)
        }}
        onBlur={(e) => {
          const newValue = Number(e.target.value)
          setTempValue(Math.max(min, Math.min(newValue, max)))
        }}
      ></input>
      <button
        className="nc-right"
        onClick={() => {
          setTempValue(Math.max(min, Math.min(tempValue + 1, max)))
        }}
      >
        <PlusIcon />
      </button>
    </div>
  )
}

export default Settings
