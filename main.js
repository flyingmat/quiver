const { app, BrowserWindow } = require('electron')

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600
    })

    win.webContents.openDevTools()
    win.loadFile('src/main.html')
}

app.whenReady().then(() => {
    createWindow()
})
