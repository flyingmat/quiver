const EventEmitter = require('events')
const { Socket } = require('net')
const { StringDecoder } = require('string_decoder')


class TwitchIRC extends EventEmitter {

    static IRC_SERV = 'irc.chat.twitch.tv'
    static IRC_PORT = 6667
    static IRC_PING_MSG = 'PING :tmi.twitch.tv'
    static IRC_PONG_MSG = 'PONG :tmi.twitch.tv'

    constructor(user, token) {
        super()

        this.user = user
        this.token = token

        this.sock = new Socket()
        this.decoder = new StringDecoder('utf8')
        this.buffer = ''
    }

    send(message) {
        this.sock.write(`${message}\r\n`)
        this.emit('sent', message)
    }

    join(channel) {
        if (!channel.startsWith('#')) channel = '#' + channel
        this.send(`JOIN ${channel}`)
    }

    checkPing() {
        const now = new Date()
        // ping the server ourselves if last ping was over 5 minutes ago
        if ((now - this.lastPing) / 60000 > 5) {
            this.send(TwitchIRC.IRC_PING_MSG)
            this.lastPing = now
        }
    }

    async connect(callback) {
        const irc = this

        this.sock.on('data', data => {
            const split = (this.buffer + this.decoder.write(data)).split('\r\n')
            this.buffer = split.pop()
            split.forEach(message => {
                if (message == TwitchIRC.IRC_PING_MSG) {
                    irc.lastPing = new Date()
                    irc.send(TwitchIRC.IRC_PONG_MSG)
                }

                this.emit('received', message)
            })
        })

        this.sock.on('error', (e) => {
            callback(e)
        })

        this.sock.on('connect', () => {
            irc.send('CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership')
            irc.send(`PASS oauth:${irc.token}`)
            irc.send(`NICK ${irc.user}`)

            irc.lastPing = new Date()
            setInterval(() => irc.checkPing(), 60000)
        })

        this.sock.connect({host: TwitchIRC.IRC_SERV, port: TwitchIRC.IRC_PORT})
    }

}

module.exports = {
    TwitchIRC
}
