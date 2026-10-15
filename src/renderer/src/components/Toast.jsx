import { useSyncExternalStore } from "react"
import { subscribe, getToasts } from "../utils/toast.js"
import { InfoIcon, CircleAlert } from "lucide-react"

function Toast() {
  const toasts = useSyncExternalStore(subscribe, getToasts)

  const typeToIcon = {
    info: <InfoIcon className="icon" />,
    warning: <InfoIcon className="icon" />,
    error: <CircleAlert className="icon" />
  }

  return (
    <div className="toasts-container">
      {toasts.map((item) => {
        return (
          <div key={item.id} className={`toast ${item.type}`}>
            {typeToIcon[item.type]}
            <div>
              <p className="title">{item.title}</p>
              <p className="content">{item.message}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default Toast
