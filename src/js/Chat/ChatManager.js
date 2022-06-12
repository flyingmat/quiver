import { TwitchIRC } from "./TwitchIRC.js"
import { Chat } from "./Chat.js"

export class ChatManager {

    constructor() {
        this.chats = new Map()
    }

    init(tmiChat) {
        this.chats = new Map()
        this.chats.set('tmi', new Set())
        this.chats.get('tmi').add(tmiChat)
    }

    createChat(config) {
        if (!this.chats.has(config.channel)) {
            TwitchIRC.join(config.channel)
            this.chats.set(config.channel, new Set())
        }

        let chat = Chat.new(config)
        this.chats.get(config.channel).add(chat)

        return chat
    }

    removeChat(chat) {
        this.chats.get(chat.channel).delete(chat)
        if (this.chats.get(chat.channel).size == 0) {
            TwitchIRC.part(chat.channel)
            this.chats.delete(chat.channel)
        }
    }

    distributeMessage(message) {
        if (this.chats.has(message.channel)) {
            this.chats.get(message.channel).forEach(chat => {
                chat.appendMessage(message)
            })
        }
    }

}
