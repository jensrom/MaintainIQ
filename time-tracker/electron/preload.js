const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getDbPath: () => ipcRenderer.invoke('get-db-path'),
  chooseDbFolder: () => ipcRenderer.invoke('choose-db-folder'),
  dbRead: (dbPath) => ipcRenderer.invoke('db-read', dbPath),
  dbWrite: (dbPath, data) => ipcRenderer.invoke('db-write', dbPath, data),
  openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),
  exportCsv: (csvContent, defaultFileName) =>
    ipcRenderer.invoke('export-csv', csvContent, defaultFileName),
  isElectron: true,
});
