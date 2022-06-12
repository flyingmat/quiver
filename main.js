const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs');
const { TwitchIRC } = require('./src/node/TwitchIRC.js')

var mainWindow = null
var config = null
var irc = null

const handleConfigRequest = () => {
    return config
}

const handleIRCConnect = (auth) => {
    console.log(auth)
    if (auth == null) {
        irc = new TwitchIRC('justinfan123', '123')
    } else {
        irc = new TwitchIRC(auth.user, auth.token)
    }

    irc.on('received', message => mainWindow.webContents.send('irc:received', message))
    irc.on('sent', message => mainWindow.webContents.send('irc:sent', message))

    irc.connect()
}

const handleIRCSend = (message) => {
    if (irc != null) {
        irc.send(message)
    }
}

const createWindow = () => {
    const win = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    win.webContents.openDevTools()
    win.loadFile('src/main.html')

    return win
}

app.whenReady().then(() => {
    try {
        if (fs.existsSync('config.json')) {
            config = JSON.parse(fs.readFileSync('config.json'))
        } else {
            config = 
            {
                twitch: {
                    'client-id': 'wetnxtnoyzcge1u9kq8rc15eh6h4tu',
                    token: null
                },
                ui: null
            }

            fs.writeFile('config.json', JSON.stringify(
                config,
                null,
                4
            ), function (err) {
                if (err) throw err;
            })
        }

        ipcMain.handle('config:get', handleConfigRequest)
        ipcMain.on('irc:connect', (e, auth) => handleIRCConnect(auth))
        ipcMain.on('irc:send', (e, message) => handleIRCSend(message))
        mainWindow = createWindow()
    } catch (e) {
        console.error(e)
        return
    }
})
