import { htmlToElement } from "../common.js"
import { Message } from "./Message.js"

export class Chat extends HTMLElement {

    static elementTag  = 'split-chat'

    static new(config) {
        let chat = document.createElement(Chat.elementTag)
        chat.channel = config.channel
        chat.appendChild(htmlToElement('<div class="chat-content"></div>'))
        return chat
    }

    constructor() {
        super()

        this.channel = null
    }

    appendMessage(message) {
        this.firstChild.appendChild(Message.new(message))
        this.scrollTop = this.scrollHeight
    }

}
