const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    requestConfig: () => ipcRenderer.invoke('config:get'),
    ircConnect: (auth = null) => ipcRenderer.send('irc:connect', auth),
    ircSend: (message) => ipcRenderer.send('irc:send', message),
    handleReceived: (callback) => ipcRenderer.on('irc:received', callback),
    handleSent: (callback) => ipcRenderer.on('irc:sent', callback)
})
