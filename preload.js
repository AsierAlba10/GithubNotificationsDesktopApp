// El archivo preload.js se ejecuta antes que el proceso de renderizado
// Permite exponer APIs específicas al proceso de renderizado

const { contextBridge, ipcRenderer, shell } = require('electron');

// Exponer API protegida a la ventana del renderizador
contextBridge.exposeInMainWorld('electron', {
           // Funciones para comunicarse con el proceso principal
           notifications: {
                      show: (options) => ipcRenderer.send('show-notification', options),
           },

           // Para interactuar con la configuración
           config: {
                      get: (key) => ipcRenderer.invoke('config-get', key),
                      set: (key, val) => ipcRenderer.send('config-set', { key, val }),
                      onSetResponse: (callback) => {
                                 const handler = (event, { success }) => {
                                            callback(success);
                                 };
                                 ipcRenderer.on('config-set-response', handler);
                                 return () => ipcRenderer.removeListener('config-set-response', handler);
                      },
           },

           // Para la API de GitHub
           github: {
                      getNotifications: () => ipcRenderer.invoke('github-get-notifications'),
                      getRepositories: () => ipcRenderer.invoke('github-get-repositories'),
                      markAsRead: (id) => ipcRenderer.send('github-mark-read', id),
                      onMarkReadResponse: (callback) => {
                                 const handler = (event, response) => {
                                            callback(response.success);
                                 };
                                 ipcRenderer.on('github-mark-read-response', handler);
                                 return () => ipcRenderer.removeListener('github-mark-read-response', handler);
                      },
           },

           // Para eventos de la app
           app: {
                      onCheckNotifications: (callback) => {
                                 ipcRenderer.on('check-notifications', callback);
                                 return () => ipcRenderer.removeListener('check-notifications', callback);
                      },
                      onNewNotification: (callback) => {
                                 ipcRenderer.on('new-notification', callback);
                                 return () => ipcRenderer.removeListener('new-notification', callback);
                      },
           },

           // Para abrir enlaces externos
           openExternal: (url) => shell.openExternal(url),
}); 