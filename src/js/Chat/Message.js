import { htmlToElement } from "../common.js"

export class Message extends HTMLElement {

    static elementTag = 'chat-message-container'

    static new(message) {
        let messageContainer = document.createElement(Message.elementTag)
        let messageTimestamp = htmlToElement('<span class="chat-message-timestamp"></span>')
        const date = new Date()
        messageTimestamp.textContent = date.getHours().toString().padStart(2, "0") + ":" + date.getMinutes().toString().padStart(2, "0") + ":" + date.getSeconds().toString().padStart(2, "0")
        let messageTextContainer = htmlToElement('<div class="chat-text-container"></div>')
        let messageElement = htmlToElement('<span class="chat-message-content raw"></span>')
        messageElement.textContent = message.content

        messageContainer.appendChild(messageTimestamp)
        messageTextContainer.appendChild(messageElement)
        messageContainer.appendChild(messageTextContainer)

        return messageContainer
    }

    constructor() {
        super()
    }

}
