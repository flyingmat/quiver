import { Tab } from "./SplitView/Tab.js"
import { Container } from "./SplitView/Container.js"
import { SplitView } from "./SplitView/SplitView.js"
import { Chat } from "./Chat/Chat.js"

import { Twitch } from "./API/Twitch.js"
import { ChatManager } from "./Chat/ChatManager.js"
import { parseMessage } from "./Chat/MessageParsing.js"


let tmi = Chat.new('tmi')
let tmiTab = Tab.new('tmi', tmi)

let chatManager = new ChatManager()
chatManager.init(tmi)


let splitView = SplitView.new(chatManager)
document.body.appendChild(splitView)

let container = Container.new()
splitView.insertContainer(container)
container.appendTab(tmiTab)


window.electronAPI.handleReceived((e, message) => {
    chatManager.distributeMessage(parseMessage(message))
})

window.electronAPI.handleSent((e, message) => {
    console.log(`SENT ${message}`)
})

window.electronAPI.requestConfig().then(config => {
    if (!('token' in config) || (config.token == null)) {
        window.electronAPI.ircConnect()
    } else {
        let twitchAPI = new Twitch(config['client-id'], config.token)
        twitchAPI.getUsers().then(r => r.json()).then(self => {
            window.electronAPI.ircConnect({
                'user': self.data[0].login,
                'token': config.token
            })
        })
    }
})

// for (let i = 1; i < 20; i++) {
//     messageProcessor.processMessage('aA'.repeat(20))
// }
