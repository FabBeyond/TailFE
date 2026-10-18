import "./assets/main.css"
import "@fontsource-variable/ibm-plex-sans"

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import { SettingsProvider } from "./hooks/useSettings"
import { TabsProvider } from "./hooks/useTabs"
import { UIProvider } from "./hooks/useUI"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <SettingsProvider>
      <TabsProvider>
        <UIProvider>
          <App />
        </UIProvider>
      </TabsProvider>
    </SettingsProvider>
  </StrictMode>
)
