import js from "@eslint/js"
import electronToolkit from "@electron-toolkit/eslint-config"
import electronToolkitPrettier from "@electron-toolkit/eslint-config-prettier"
import pluginReact from "eslint-plugin-react"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import { defineConfig } from "eslint/config"

export default defineConfig([
  { ignores: ["out/**", "dist/**", "node_modules/**"] },
  { files: ["**/*.{js,mjs,cjs,jsx}"], plugins: { js }, extends: ["js/recommended"] },
  electronToolkit,
  pluginReact.configs.flat.recommended,
  reactHooks.configs.flat["recommended-latest"],
  {
    files: ["**/*.{jsx,js}"],
    plugins: { "react-refresh": reactRefresh },
    rules: {
      "react-refresh/only-export-components": "warn",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off"
    },
    settings: {
      react: { version: "detect" }
    }
  },
  electronToolkitPrettier
])
