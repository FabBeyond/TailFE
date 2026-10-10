import { useSyncExternalStore } from "react"
import { subscribe, getToasts } from "../utils/toast.js"

function Toast() {
  const toasts = useSyncExternalStore(subscribe, getToasts)

  return (
    <div className="toasts-container">
      {toasts.map((item) => (
        <div key={item.id} className="toast">
          <p className="title">{item.title}</p>
          <div className="divider"></div>
          <p className="content">{item.message}</p>
        </div>
      ))}
    </div>
  )
}

export default Toast
