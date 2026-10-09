import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  readDir: (path) => ipcRenderer.invoke('read-dir', path),
  deleteFile: (path) => ipcRenderer.invoke('delete-file', path),
  createFolder: (path) => ipcRenderer.invoke('create-folder', path)
})
