import { htmlToElement } from "../common.js"

export class ChatBar extends HTMLElement {

    static elementTag = 'split-chat-bar'

    static new() {
        let chatBar = document.createElement(ChatBar.elementTag)
        let dropArea = htmlToElement('<div class="split-chat-bar-empty"></div>')
        
        dropArea.addEventListener('dragenter', e => chatBar.onDragEnter(e))
        dropArea.addEventListener('dragleave', e => chatBar.onDragLeave(e))
        dropArea.addEventListener('dragover', e => chatBar.onDragOver(e))
        dropArea.addEventListener('drop', e => chatBar.onDrop(e))

        chatBar.appendChild(dropArea)
        chatBar.dropArea = dropArea

        return chatBar
    }

    constructor() {
        super()

        this.dropArea = null
        this.container = null
    }

    appendTab(tab) {
        this.insertBefore(tab, this.dropArea)
    }

    removeTab(tab) {
        this.removeChild(tab)
    }

    onDragEnter(e) {
        this.droppable = true
        this.classList.add('opacity-animated')
    }

    onDragLeave(e) {
        this.droppable = false
    }

    onDragOver(e) {
        e.preventDefault()
    }

    onDrop(e) {
        e.preventDefault()
        this.classList.remove('opacity-animated')
        this.droppable = false
        this.container.dropTab()
    }

    get droppable() {
        return this.classList.contains('droppable')
    }

    set droppable(val) {
        if (val) {
            this.classList.add('droppable')
        } else {
            this.classList.remove('droppable')
        }
    }

}
