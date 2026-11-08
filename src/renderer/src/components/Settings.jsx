import { useState } from "react"
import { PlusIcon, MinusIcon, XIcon, RotateCcw } from "lucide-react"
import { useSettings } from "../hooks/useSettings"
import { useUI } from "../hooks/useUI"

const settingsSchema = [
  {
    id: "general",
    label: "General",
    settings: [
      { type: "label", label: "VIEW" },
      {
        key: "showDotFiles",
        label: "Show hidden files",
        desc: "Show dotfiles like .git or .config",
        type: "toggle"
      },
      {
        key: "darkenDotFiles",
        label: "Darken hidden files",
        desc: "Darken the text of hidden files",
        type: "toggle"
      },
      {
        key: "foldersOnTop",
        label: "Folders on top",
        desc: "Sort folders before files",
        type: "toggle"
      },
      {
        key: "mainZoom",
        label: "File List Zoom",
        desc: "Size of files in the file list",
        type: "number",
        min: 1,
        unit: "px"
      },
      { type: "label", label: "Popups" },
      {
        key: "showDeleteConfirmation",
        label: "Delete confirmation popup",
        desc: "Open a popup to confirm file deletion",
        type: "toggle"
      }
    ]
  },
  {
    id: "behaviour",
    label: "Behaviour",
    settings: [
      { type: "label", label: "DRAGGING" },
      {
        key: "dragDeadzone",
        label: "Drag deadzone",
        desc: "Min. distance to start dragging files",
        type: "number",
        min: 1,
        max: 99,
        unit: "px"
      }
    ]
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
        <div className="modal settings" onClick={(e) => e.stopPropagation()}>
          <div className="modal-titlebar">
            <p>Settings</p>
            <XIcon onClick={() => setSettingsOpen(false)} className="close-button" />
          </div>
          <div className="settings-main-panel">
            <div className="categories">
              {settingsSchema.map((item) => (
                <p
                  className={activeId == item.id ? "selected-settings-cat" : ""}
                  key={item.id}
                  onClick={() => setActiveId(item.id)}
                >
                  {item.label}
                </p>
              ))}
            </div>
            <div className="settings-content">
              {active.settings.map((item, idx) => (
                <div key={item.key ?? idx}>
                  <SettingsRow setting={item} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingsRow({ setting }) {
  const { DEFAULT_SETTINGS, updateSetting, ...settings } = useSettings()

  if (setting.type === "label") {
    return <p className="settings-title">{setting.label}</p>
  }
  const Control = controls[setting.type]

  return (
    <div className="settings-row">
      <div className="setting-left-side">
        <p className="setting-label">{setting.label}</p>
        <p className="setting-desc">{setting.desc}</p>
      </div>
      <div className="setting-right-side">
        <Control setting={setting} />
        <RotateCcw
          onClick={() => updateSetting(setting.key, DEFAULT_SETTINGS[setting.key])}
          className={settings[setting.key] == DEFAULT_SETTINGS[setting.key] ? "disabled" : ""}
        />
      </div>
    </div>
  )
}

function ToggleControl({ setting }) {
  const { updateSetting, ...settings } = useSettings()
  const isOn = Boolean(settings[setting.key])

  return (
    <button
      className={`toggle-control ${isOn ? "on" : ""}`}
      onClick={() => updateSetting(setting.key, !isOn)}
    >
      <div className="toggle-thumb" />
    </button>
  )
}
function NumberControl({ setting }) {
  const { updateSetting, ...settings } = useSettings()
  const saved = settings[setting.key]
  const [draft, setDraft] = useState(null)
  const shownValue = draft ?? saved

  const min = setting.min ?? -Infinity
  const max = setting.max ?? Infinity

  const commit = (value) => {
    const clamped = Math.max(min, Math.min(value, max))
    setDraft(null)
    updateSetting(setting.key, clamped)
  }

  return (
    <div className="number-control">
      <button
        onClick={() => commit(shownValue - 1)}
        className={shownValue <= min ? "off disabled" : ""}
      >
        <MinusIcon />
      </button>
      <input
        type="text"
        value={shownValue}
        onChange={(e) => {
          const newValue = Number(e.target.value)
          if (!isNaN(newValue)) setDraft(newValue)
        }}
        onBlur={(e) => commit(Number(e.target.value))}
      ></input>
      {setting.unit && <p>{setting.unit}</p>}

      <button
        onClick={() => commit(shownValue + 1)}
        className={shownValue >= max ? "off disabled" : ""}
      >
        <PlusIcon />
      </button>
    </div>
  )
}

export default Settings
