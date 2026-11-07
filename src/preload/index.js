import { contextBridge, ipcRenderer } from "electron"

contextBridge.exposeInMainWorld("api", {
  readDir: (path) => ipcRenderer.invoke("read-dir", path),
  deleteFile: (path) => ipcRenderer.invoke("delete-file", path),
  createFolder: (path) => ipcRenderer.invoke("create-folder", path),
  rename: (path, newPath) => ipcRenderer.invoke("rename", path, newPath),
  openFile: (path) => ipcRenderer.invoke("open-file", path),
  getPath: (name) => ipcRenderer.invoke("get-path", name),
  move: (oldPath, destDir, copy = false) => ipcRenderer.invoke("move", oldPath, destDir, copy),
  loadSettings: () => ipcRenderer.invoke("load-settings"),
  saveSettings: (settings) => ipcRenderer.invoke("save-settings", settings),
  extractArchive: (path) => ipcRenderer.invoke("extract-archive", path),
  createArchive: (paths, destZip) => ipcRenderer.invoke("create-archive", paths, destZip),
  listDrives: () => ipcRenderer.invoke("list-drives"),
  platform: process.platform
})
