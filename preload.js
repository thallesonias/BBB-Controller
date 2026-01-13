
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  automateVotes: (votes, coords) => ipcRenderer.invoke('automate-votes', votes, coords),
  toggleCompact: (isCompact) => ipcRenderer.send('toggle-compact', isCompact)
});
