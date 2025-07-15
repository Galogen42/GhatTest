const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  generate(description) {
    return ipcRenderer.invoke('generate', description);
  }
});
