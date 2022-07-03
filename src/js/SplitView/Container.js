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

        splitOverlay.addEventListener('dragover', e => container.onDragOver(e))
        splitOverlay.addEventListener('dragenter', e => container.onDragEnter(e))
        splitOverlay.addEventListener('dragleave', e => container.onDragLeave(e))
        splitOverlay.addEventListener('drop', e => container.onDrop(e))

        return container
    }

    constructor() {
        super()

        this.splitView = null
        this.chatBar = null
        this.chatContainer = null
        this.splitOverlay = null

        this.activeTab = null

        this.dragOverTick = false
        this.dragRect = null
        this.overlayPos = ''
    }

    connectedCallback() {
        this.splitView = this.parentElement
        this.dragRect = this.getBoundingClientRect()
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
        for (const container of [...this.splitView.children].filter(e => e instanceof Container)) {
            container.splitOverlay.classList.add('active')
        }
    }

    dragEndTab(e, tab) {
        for (const container of [...this.splitView.children].filter(e => e instanceof Container)) {
            container.splitOverlay.classList.remove('active')
        }
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
        
        if (!this.dragOverTick) {
            this.dragOverTick = true

            requestAnimationFrame(() => {
                let w = this.dragRect.width
                let offset = e.clientX - this.dragRect.x
        
                if (offset < w / 3) {
                    this.overlayPosition = 'left'
                } else if (offset > 2 * w / 3) {
                    this.overlayPosition = 'right'
                } else {
                    this.overlayPosition = ''
                }

                this.dragOverTick = false
            })
        }
    }

    onDragEnter(e) {
        if (this.tabs == 1 && this.splitView.dragActiveTab.container == this) {
            return
        }

        this.dragRect = this.getBoundingClientRect()
        
        this.splitOverlay.classList.add('droppable')
        this.splitOverlay.classList.add('opacity-animated')
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.splitOverlay.classList.add('animated')
            })
        })
    }

    onDragLeave(e) {
        if (this.tabs == 1 && this.splitView.dragActiveTab.container == this) {
            return
        }

        this.splitOverlay.classList.remove('droppable')
        this.splitOverlay.classList.remove('animated')
        // this.chatContainer.firstChild.nextElementSibling.classList.remove('inactive')
    }

    onDrop(e) {
        if (this.tabs == 1 && this.splitView.dragActiveTab.container == this) {
            return
        }
        e.preventDefault()

        this.splitOverlay.classList.remove('droppable')
        this.splitOverlay.classList.remove('opacity-animated')
        this.splitOverlay.classList.remove('animated')
        // this.chatContainer.firstChild.nextElementSibling.classList.remove('inactive')

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

    get splitWidth() {
        // return this.style.getPropertyValue('--split-width')
        return this.style.width
    }

    set splitWidth(value) {
        this.style.width = value
        // this.style.setProperty('--split-width', value)
        // this.dispatchEvent(new CustomEvent('split-width', {detail: value}))
    }

    get overlayPosition() {
        return this.overlayPos
    }

    set overlayPosition(value) {
        if (this.overlayPos != value) {
            if (this.overlayPos != '') {
                this.splitOverlay.classList.remove(this.overlayPos)
            }
            if (value != '') {
                this.splitOverlay.classList.add(value)
            }
            this.overlayPos = value
        }
    }

}
