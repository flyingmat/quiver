export class Chat extends HTMLElement {

    static elementTag  = 'split-chat'

    static new(content) {
        let chat = document.createElement(Chat.elementTag)
        chat.textContent = content
        return chat
    }

    constructor() {
        super()
    }

}
