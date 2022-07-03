import { Tab } from "./SplitView/Tab.js"
import { Container } from "./SplitView/Container.js"
import { SplitView } from "./SplitView/SplitView.js"
import { Chat } from "./Chat/Chat.js"

import { Twitch, TwitchWrapper } from "./API/Twitch.js"
import { ChatManager } from "./Chat/ChatManager.js"
import { parseMessage } from "./Chat/MessageParsing.js"
import { EmoteManager } from "./API/EmoteManager.js"
import { BetterTTV } from "./API/BetterTTV.js"
import { FrankerFaceZ } from "./API/FrankerFaceZ.js"
import { TwitchIRC } from "./Chat/TwitchIRC.js"
import { SevenTV } from "./API/SevenTV.js"

let chatManager = null

let tmi = Chat.new('tmi')

window.ircc = TwitchIRC

window.electronAPI.requestConfig().then(config => {
    if (!('token' in config.twitch) || (config.twitch.token == null)) {
        chatManager = new ChatManager(new EmoteManager(null, null, null, null))
        chatManager.init(tmi)

        window.electronAPI.handleReceived((e, message) => {
            chatManager.distributeMessage(parseMessage(message))
        })
        
        window.electronAPI.handleSent((e, message) => {
            console.log(`SENT ${message}`)
        })
        
        let splitView = SplitView.new(chatManager)
        document.body.appendChild(splitView)
        let container = Container.new()
        splitView.insertContainer(container)
        let tmiTab = Tab.new('tmi', tmi)
        container.appendTab(tmiTab)

        window.electronAPI.ircConnect()
    } else {
        let twitchAPI = new Twitch(config.twitch['client-id'], config.twitch.token)
        let APIs = [new BetterTTV(), new FrankerFaceZ(), new SevenTV()]

        window.twitchWrapper = new TwitchWrapper(twitchAPI)
        chatManager = new ChatManager(new EmoteManager(twitchWrapper, ...APIs.map(API => new API.emoteProvider(API))))
        window.twitchEmoteProvider = new twitchAPI.emoteProvider(twitchAPI)
        window.chatManager = chatManager
        chatManager.init(tmi)

        window.electronAPI.handleReceived((e, message) => {
            chatManager.distributeMessage(parseMessage(message))
        })
        
        window.electronAPI.handleSent((e, message) => {
            console.log(`SENT ${message}`)
        })

        let splitView = SplitView.new(chatManager)
        document.body.appendChild(splitView)
        let container = Container.new()
        splitView.insertContainer(container)
        let tmiTab = Tab.new('tmi', tmi)
        container.appendTab(tmiTab)
        
        twitchAPI.getUsers().then(r => r.json()).then(self => {
            window.electronAPI.ircConnect({
                'user': self.data[0].login,
                'token': config.twitch.token
            })
        })
    }
})

// chatManager = new ChatManager(new EmoteManager(null))
// chatManager.init(tmi)

// window.electronAPI.handleReceived((e, message) => {
//     chatManager.distributeMessage(parseMessage(message))
// })

// window.electronAPI.handleSent((e, message) => {
//     console.log(`SENT ${message}`)
// })

// let splitView = SplitView.new(chatManager)
// document.body.appendChild(splitView)
// let container = Container.new()
// splitView.insertContainer(container)
// let tmiTab = Tab.new('tmi', tmi)
// container.appendTab(tmiTab)

// for (let i = 1; i < 30; i++) {
//     chatManager.distributeMessage(parseMessage('aA'.repeat(i * 2)))
// }
