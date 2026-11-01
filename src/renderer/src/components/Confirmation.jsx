import { useSyncExternalStore } from "react"
import { subscribe, getConfirmation, answerConfirmation } from "../utils/confirmation"

function Confirmation() {
  const data = useSyncExternalStore(subscribe, getConfirmation)
  if (!data) return null

  return (
    <div className="properties-blocker">
      <div className="confirmation">
        <p className="title">{data.title}</p>
        <p className="msg">{data.message}</p>
        <div className="confirm-buttons">
          <button className="false" onClick={() => answerConfirmation(false)}>
            {data.cancelText}
          </button>
          <button className="true" onClick={() => answerConfirmation(true)}>
            {data.confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Confirmation
