const { app, BrowserWindow, ipcMain, session } = require('electron')
const path = require('path')
const fs = require('fs')
const { TwitchIRC } = require('./src/node/TwitchIRC.js')

var mainWindow = null
var config = null
var irc = null

const handleConfigRequest = () => {
    return config
}

const handleIRCConnect = (auth) => {
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

createAuthWindow = () => {
    const options = {
        response_type: 'token',
        client_id: 'wetnxtnoyzcge1u9kq8rc15eh6h4tu',
        redirect_uri: 'http://localhost',
        scope: ['chat:read', 'chat:edit'],
    }

    const authWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        'node-integration': false
    })

    authWindow.setMenu(null)

    let twitchUrl = 'https://api.twitch.tv/kraken/oauth2/authorize?'
    let authUrl = twitchUrl
        + 'response_type=' + options.response_type
        + '&client_id=' + options.client_id
        + '&redirect_uri=' + options.redirect_uri
        + '&scope=' + options.scope.join(" ")

    authWindow.loadURL(authUrl)
    authWindow.show()

    function handleCallback(event, redirectUrl) {
        if (redirectUrl.match(new RegExp("http://localhost/#.+")) === null) {
            return
        } else {
            event.preventDefault()
        }

        const params = redirectUrl.split('#')[1].split('&').reduce((obj, p) => {
            const pSplit = p.split('=')
            obj[pSplit[0]] = pSplit[1]
            return obj
        }, {})


        config.twitch.token = params['access_token']
        fs.writeFile('config.json', JSON.stringify(
            config,
            null,
            4
        ), function (err) {
            if (err) throw err
        })
        
        mainWindow = createWindow()
        authWindow.destroy()
    }

    authWindow.webContents.on('will-navigate', (event, url) => handleCallback(event, url))
    authWindow.webContents.on('did-get-redirect-request', (event, oldUrl, newUrl) => handleCallback(event, newUrl))
    authWindow.on('close', () => {
        mainWindow = createWindow()
        authWindow.destroy()
    }, false)
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
    // session.defaultSession.clearStorageData([], (data) => {})
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
                if (err) throw err
            })
        }

        ipcMain.handle('config:get', handleConfigRequest)
        ipcMain.on('irc:connect', (e, auth) => handleIRCConnect(auth))
        ipcMain.on('irc:send', (e, message) => handleIRCSend(message))

        if (config.twitch.token == null) {
            createAuthWindow()
        } else {
            mainWindow = createWindow()
        }
    } catch (e) {
        console.error(e)
        return
    }
})
