import { ChatBar } from "./ChatBar.js"
import { htmlToElement } from "../common.js"

export class Container extends HTMLElement {

    static elementTag = 'split-container'

    static new() {
        let container = document.createElement(Container.elementTag)
        let chatBar = ChatBar.new()
        let chatContainer = htmlToElement('<div class="split-chat-container"></div>')
        let splitOverlay = htmlToElement('<div class="split-container-overlay"></div>')
        let splitOverlayContent = htmlToElement('<div class="split-container-overlay-content"></div>')
        
        splitOverlay.appendChild(splitOverlayContent)
        chatContainer.appendChild(splitOverlay)

        container.appendChild(chatBar)
        container.appendChild(chatContainer)
        
        chatBar.container = container
        container.chatBar = chatBar
        container.chatContainer = chatContainer
        container.splitOverlay = splitOverlay

        chatContainer.addEventListener('dragover', e => container.onDragOver(e))
        chatContainer.addEventListener('dragenter', e => container.onDragEnter(e))
        chatContainer.addEventListener('dragleave', e => container.onDragLeave(e))
        chatContainer.addEventListener('drop', e => container.onDrop(e))

        return container
    }

    constructor() {
        super()

        this.splitView = null
        this.chatBar = null
        this.chatContainer = null
        this.splitOverlay = null

        this.activeTab = null
        this.tabs = 0
    }

    connectedCallback() {
        this.splitView = this.parentElement
    }

    disconnectedCallback() {
        this.splitView = null
    }

    appendTab(tab) {
        this.chatBar.appendTab(tab)
        this.activateTab(null, tab)
        this.tabs++
    }

    removeTab(tab) {
        let newActiveTab = [this.activeTab.previousElementSibling, this.activeTab.nextElementSibling].find(t => t != null && t != this.chatBar.dropArea)
        this.chatBar.removeTab(tab)
        this.tabs--
        if (newActiveTab !== undefined) {
            this.activateTab(null, newActiveTab)
        } else {
            this.activeTab = null
            this.splitView.removeContainer(this)
        }
    }

    activateTab(e, tab) {
        this.deactivateActiveTab()
        this.chatContainer.appendChild(tab.chat)
        tab.active = true
        this.activeTab = tab
    }

    deactivateActiveTab() {
        if (this.activeTab != null) {
            this.activeTab.active = false
            this.activeTab.chat.remove()
        }
    }

    dragTab(e, tab) {
        this.splitView.dragTab(e, tab)
    }

    dropTab() {
        this.splitView.dropTab(this)
    }

    onDragOver(e) {
        if (this.tabs == 1 && this.splitView.dragActiveTab.container == this) {
            return
        }
        e.preventDefault()

        let w = this.getBoundingClientRect().width
        let offset = e.clientX - this.getBoundingClientRect().x

        if (offset < w / 3) {
            this.splitOverlay.classList.remove('right')
            this.splitOverlay.classList.add('left')
        } else if (offset > 2 * w / 3) {
            this.splitOverlay.classList.remove('left')
            this.splitOverlay.classList.add('right')
        } else {
            this.splitOverlay.classList.remove('right')
            this.splitOverlay.classList.remove('left')
        }
    }

    onDragEnter(e) {
        if (this.tabs == 1 && this.splitView.dragActiveTab.container == this) {
            return
        }
        this.splitOverlay.classList.add('droppable')
        this.splitOverlay.classList.add('opacity-animated')
        setTimeout(() => this.splitOverlay.classList.add('animated'), 10)
    }

    onDragLeave(e) {
        if (this.tabs == 1 && this.splitView.dragActiveTab.container == this) {
            return
        }
        this.splitOverlay.classList.remove('droppable')
        this.splitOverlay.classList.remove('animated')
    }

    onDrop(e) {
        if (this.tabs == 1 && this.splitView.dragActiveTab.container == this) {
            return
        }
        e.preventDefault()

        this.splitOverlay.classList.remove('droppable')
        this.splitOverlay.classList.remove('opacity-animated')
        this.splitOverlay.classList.remove('animated')

        let w = this.getBoundingClientRect().width
        let offset = e.clientX - this.getBoundingClientRect().x

        if (offset < w / 3) {
            // let newContainer = Container.new()
            // this.splitView.insertContainer(newContainer, {'next': this})
            // newContainer.dropTab(this.splitView.dragActiveTab)
            this.splitView.splitContainer({'next': this})
        } else if (offset > 2 * w / 3) {
            // let newContainer = Container.new()
            // this.splitView.insertContainer(newContainer, {'previous': this})
            // newContainer.dropTab(this.splitView.dragActiveTab)
            this.splitView.splitContainer({'previous': this})
        } else {
            console.log('full')
        }
    }

}
