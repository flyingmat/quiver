import { ChatBar } from "./ChatBar.js"
import { htmlToElement } from "../common.js"
import { Tab } from "./Tab.js"
import { NewTabDialog } from "./NewTabDialog.js"

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
    }

    removeTab(tab) {
        let newActiveTab = [this.activeTab.previousElementSibling, this.activeTab.nextElementSibling].find(t => t != null && t != this.chatBar.dropArea)
        this.chatBar.removeTab(tab)
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

    initAddTab() {
        this.appendTab(Tab.new('New Chat', NewTabDialog.new()))
    }

    finishAddTab(config) {
        let dialogTab = this.activeTab
        let newChat = this.splitView.createChat(config)

        dialogTab.chat.remove()
        dialogTab.title = newChat.channel
        dialogTab.chat = newChat
        this.activateTab(null, dialogTab)
    }

    onDragOver(e) {
        if (this.tabs == 1 && this.splitView.dragActiveTab.container == this) {
            return
        }
        e.preventDefault()

        this.splitOverlay.classList.add('droppable')
        this.splitOverlay.classList.add('opacity-animated')

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
        
        setTimeout(() => this.splitOverlay.classList.add('animated'), 10)
        setTimeout(() => this.chatContainer.firstChild.nextElementSibling.classList.add('inactive'), 10)
    }

    onDragLeave(e) {
        if (this.tabs == 1 && this.splitView.dragActiveTab.container == this) {
            return
        }

        this.splitOverlay.classList.remove('droppable')
        this.splitOverlay.classList.remove('animated')
        this.chatContainer.firstChild.nextElementSibling.classList.remove('inactive')
    }

    onDrop(e) {
        if (this.tabs == 1 && this.splitView.dragActiveTab.container == this) {
            return
        }
        e.preventDefault()

        this.splitOverlay.classList.remove('droppable')
        this.splitOverlay.classList.remove('opacity-animated')
        this.splitOverlay.classList.remove('animated')
        this.chatContainer.firstChild.nextElementSibling.classList.remove('inactive')

        let w = this.getBoundingClientRect().width
        let offset = e.clientX - this.getBoundingClientRect().x

        if (offset < w / 3) {
            this.splitView.splitContainer({'next': this})
        } else if (offset > 2 * w / 3) {
            this.splitView.splitContainer({'previous': this})
        } else {
            console.log('full')
        }
    }

    get tabs() {
        return this.chatBar.children.length - 2
    }

}
