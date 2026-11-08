import "./assets/main.css"
import "@fontsource-variable/ibm-plex-sans"

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import { SettingsProvider } from "./hooks/useSettings"
import { TabsProvider } from "./hooks/useTabs"
import { UIProvider } from "./hooks/useUI"

const initialSettings = await window.api.loadSettings()

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <SettingsProvider initialSettings={initialSettings}>
      <TabsProvider startupPath={initialSettings.startupPath}>
        <UIProvider>
          <App />
        </UIProvider>
      </TabsProvider>
    </SettingsProvider>
  </StrictMode>
)
