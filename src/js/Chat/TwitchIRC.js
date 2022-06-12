export class TwitchIRC {

    static join(...channels) {
        window.electronAPI.ircSend(`JOIN ${channels.join(',')}`)
    }

    static part(...channels) {
        window.electronAPI.ircSend(`PART ${channels.join(',')}`)
    }

}
