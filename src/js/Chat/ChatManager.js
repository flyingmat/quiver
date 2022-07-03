import { TwitchIRC } from "./TwitchIRC.js"
import { Chat } from "./Chat.js"

export class ChatManager {

    constructor(emoteManager) {
        this.emoteManager = emoteManager
        this.chats = {}
        this.emojiPromise = null
    }

    init(tmiChat) {
        this.chats.tmi = {'active': true, 'roomstate': null, 'emoteSets': null, 'emotes': null, 'chats': new Set([tmiChat])}
        this.emojiPromise = this.emoteManager.getEmojis()
    }

    createChat(config) {
        let chat = Chat.new(config)

        if (!(config.channel in this.chats)) {
            this.chats[config.channel] = {'active': false, 'roomstate': null, 'emoteSets': null, 'emotes': null, 'chats': new Set()}
        }
        
        if (!this.chats[config.channel].active) {
            TwitchIRC.join(config.channel)
            this.chats[config.channel].active = true
        } else {
            chat.onUserState(this.chats[config.channel].emoteSets)
            chat.onRoomState(this.chats[config.channel].emotes, this.chats.tmi.emotes)
        }

        this.chats[config.channel].chats.add(chat)

        chat.setEmojis(this.emojiPromise)

        return chat
    }

    removeChat(chat) {
        this.chats[chat.channel].chats.delete(chat)
        if (this.chats[chat.channel].chats.size == 0) {
            TwitchIRC.part(chat.channel)
            this.chats[chat.channel].active = false
        }
    }

    onGlobalUserState(message) {
        this.emoteManager.getEmoteSets(message.tags['emote-sets'].split(',')).then(emoteSets => this.chats.tmi.emoteSets = emoteSets)
        this.emoteManager.getGlobalEmotes().then(globalEmotes => this.chats.tmi.emotes = globalEmotes)
    }

    onUserState(message) {
        let emoteSetsPromise = this.emoteManager.getEmoteSets(message.tags['emote-sets'].split(','))
        this.chats[message.channel].emoteSets = emoteSetsPromise
        this.chats[message.channel].chats.forEach(chat => chat.onUserState(emoteSetsPromise))
    }

    onRoomState(message) {
        this.chats[message.channel].roomstate = message.tags
        let channelEmotesPromise = this.emoteManager.getChannelEmotes(message.tags['room-id'])
        this.chats[message.channel].emotes = channelEmotesPromise
        this.chats[message.channel].chats.forEach(chat => chat.onRoomState(channelEmotesPromise, this.chats.tmi.emotes))
    }

    distributeMessage(message) {
        if (message.channel in this.chats) {
            if (message.type === 'GLOBALUSERSTATE') {
                // @badge-info=<badge-info>;badges=<badges>;color=<color>;display-name=<display-name>;emote-sets=<emote-sets>;turbo=<turbo>;user-id=<user-id>;user-type=<user-type>
                this.onGlobalUserState(message)
            } else if (message.type === 'USERSTATE') {
                // @badge-info=<badge-info>;badges=<badges>;color=<color>;display-name=<display-name>;emote-sets=<emote-sets>;mod=<mod>;subscriber=<subscriber>;turbo=<turbo>;user-type=<user-type>
                this.onUserState(message)
            } else if (message.type === 'ROOMSTATE') {
                // @emote-only=<emote-only>;followers-only=<followers-only>;r9k=<r9k>;rituals=<rituals>;room-id=<room-id>;slow=<slow>;subs-only=<subs-only>
                this.onRoomState(message)
            }

            this.chats[message.channel].chats.forEach(chat => chat.appendMessage(message))
        }
    }

}
