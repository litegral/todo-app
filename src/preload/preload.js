const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  platform: process.platform,
  todos: {
    list: () => ipcRenderer.invoke('todos:list'),
    create: (title) => ipcRenderer.invoke('todos:create', title),
    update: (id, title) => ipcRenderer.invoke('todos:update', id, title),
    setCompleted: (id, completed) => ipcRenderer.invoke('todos:set-completed', id, completed),
    remove: (id) => ipcRenderer.invoke('todos:delete', id),
    clearCompleted: () => ipcRenderer.invoke('todos:clear-completed'),
  },
});
