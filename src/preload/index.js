import { contextBridge, ipcRenderer } from "electron"

contextBridge.exposeInMainWorld("api", {
  readDir: (path) => ipcRenderer.invoke("read-dir", path),
  deleteFile: (path) => ipcRenderer.invoke("delete-file", path),
  createFolder: (path) => ipcRenderer.invoke("create-folder", path),
  rename: (path, newPath) => ipcRenderer.invoke("rename", path, newPath),
  openFile: (path) => ipcRenderer.invoke("open-file", path),
  getPath: (name) => ipcRenderer.invoke("get-path", name)
})
