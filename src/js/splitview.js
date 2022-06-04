function htmlToElement(html) {
    let template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstChild;
}

class Tab extends HTMLElement {

    static element = 'split-chat-tab'

    static new(title, chat) {
        let tab = document.createElement(Tab.element)
        tab.setAttribute('draggable', true)
        tab.title = title
        tab.chat = chat
        return tab
    }

    static get observedAttributes() {
        return ['title']
    }
    
    constructor() {
        super()

        this.container = null
        this.addEventListener('mousedown', e => this.container.activateTab(e, this))
        this.addEventListener('dragstart', e => this.container.dragTab(e, this))
    }
    
    connectedCallback() {
        this.container = this.parentElement.parentElement
    }

    disconnectedCallback() {
        this.container = null
    }

    attributeChangedCallback(attrName, oldVal, newVal) {
        if (attrName == 'title') {
            this.textContent = newVal
        }
    }

    get title() {
        return this.getAttribute('title')
    }

    set title(val) {
        if (val == null) {
            this.removeAttribute('title')
        } else {
            this.setAttribute('title', val)
        }
    }

    get active() {
        return this.classList.contains('active')
    }

    set active(val) {
        if (val) {
            this.classList.add('active')
        } else {
            this.classList.remove('active')
        }
    }

}

class ChatBar extends HTMLElement {

    static element = 'split-chat-bar'

    static new() {
        let chatBar = document.createElement(ChatBar.element)
        let empty = htmlToElement('<div class="split-chat-bar-empty"></div>')
        
        empty.addEventListener('dragenter', e => chatBar.onDragEnterEmpty(e))
        empty.addEventListener('dragleave', e => chatBar.onDragLeaveEmpty(e))
        empty.addEventListener('dragover', e => chatBar.onDragOverEmpty(e))
        empty.addEventListener('drop', e => chatBar.onDropEmpty(e))

        chatBar.appendChild(empty)
        chatBar.empty = empty

        return chatBar
    }

    constructor() {
        super()

        this.empty = null
        this.container = null
    }

    appendTab(tab) {
        this.insertBefore(tab, this.empty)
    }

    removeTab(tab) {
        this.removeChild(tab)
    }

    onDragEnterEmpty(e) {
        this.droppable = true
    }

    onDragLeaveEmpty(e) {
        this.droppable = false
    }

    onDragOverEmpty(e) {
        e.preventDefault()
    }

    onDropEmpty(e) {
        e.preventDefault()
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

class Container extends HTMLElement {

    static element = 'split-container'

    static new() {
        let container = document.createElement(Container.element)
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

    dragTab(e, tab) {
        this.splitView.dragTab(e, tab)
    }

    dropTab() {
        let oldContainer = this.splitView.dragActiveTab.container
        let thisWidth = this.getBoundingClientRect().width
        let oldWidth = oldContainer.getBoundingClientRect().width
        oldContainer.removeTab(this.splitView.dragActiveTab)
        if (oldContainer.splitView == null) {
            this.style.width = `${thisWidth + oldWidth + 2}px`
        }
        this.appendTab(this.splitView.dragActiveTab)
    }

    removeTab(tab) {
        let newActiveTab = [this.activeTab.previousElementSibling, this.activeTab.nextElementSibling].find(t => t != null && t != this.chatBar.empty)
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

    onDragOver(e) {
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
        this.splitOverlay.classList.add('droppable')
        this.splitOverlay.classList.add('opacity-animated')
        setTimeout(() => this.splitOverlay.classList.add('animated'), 10)
    }

    onDragLeave(e) {
        this.splitOverlay.classList.remove('droppable')
        this.splitOverlay.classList.remove('animated')
    }

    onDrop(e) {
        e.preventDefault()
        this.splitOverlay.classList.remove('droppable')
        this.splitOverlay.classList.remove('animated')
        this.splitOverlay.classList.remove('opacity-animated')

        let w = this.getBoundingClientRect().width
        let offset = e.clientX - this.getBoundingClientRect().x

        if (offset < w / 3) {
            let newContainer = Container.new()
            this.splitView.insertContainer(newContainer, {'next': this})
            newContainer.dropTab(this.splitView.dragActiveTab)
        } else if (offset > 2 * w / 3) {
            let newContainer = Container.new()
            this.splitView.insertContainer(newContainer, {'previous': this})
            newContainer.dropTab(this.splitView.dragActiveTab)
        } else {
            console.log('full')
        }
    }

}

class Resizer extends HTMLElement {

    static element = 'split-resizer'

    static new() {
        let resizer = document.createElement(Resizer.element)
        let resizerHover = htmlToElement('<div class="split-resizer-hover"></div>')
        let resizerLine = htmlToElement('<div class="split-resizer-line"></div>')
        resizerHover.appendChild(resizerLine)
        resizer.appendChild(resizerHover)
        return resizer
    }

    constructor() {
        super()

        this.splitView = null

        this.addEventListener('mousedown', e => this.splitView.resizerMouseDown(e, this))
    }

    connectedCallback() {
        this.splitView = this.parentElement
    }

}

class SplitView extends HTMLElement {

    static element = 'split-view'

    static new() {
        return document.createElement(SplitView.element)
    }

    constructor() {
        super()

        this.containers = 0
        this.dragActiveTab = null
        this.activeResizer = null

        this.resizerStartX = null
        this.resizerStartWidths = null
        this.resizerLeft = null
        this.resizerRight = null
        this.resizerCorrection = 0
    }

    _updateContainerWidths() {
        let containers = [...this.children].filter(e => e instanceof Container)
        let widths = containers.map(c => c.getBoundingClientRect().width)
        for (let i = 0; i < containers.length; i++) {
            containers[i].style.width = `${widths[i]}px`
        }
    }

    _appendContainer(container) {
        if (this.containers > 0) {
            this.appendChild(Resizer.new())
        }
        this.appendChild(container)
        this.containers++
    }

    insertContainer(container, where = null) {
        if (where == null) {
            this._appendContainer(container)
        } else if ('next' in where) {
            let newWidth = Math.max(200, where.next.getBoundingClientRect().width / 2 - 1)
            
            container.style.width = `${newWidth}px`
            where.next.style.width = `${newWidth}px`
            
            this.insertBefore(container, where.next)
            this.insertBefore(Resizer.new(), where.next)

            if (newWidth == 200) {
                this._updateContainerWidths()
            }
        } else if ('previous' in where) {
            let newWidth = Math.max(200, where.previous.getBoundingClientRect().width / 2 - 1)

            container.style.width = `${newWidth}px`
            where.previous.style.width = `${newWidth}px`
            
            if (where.previous.nextElementSibling != null) {
                let next = where.previous.nextElementSibling.nextElementSibling
                this.insertBefore(container, next)
                this.insertBefore(Resizer.new(), next)
            } else {
                this._appendContainer(container)
            }

            if (newWidth == 200) {
                this._updateContainerWidths()
            }
        }
    }

    removeContainer(container) {
        let resizer = [container.previousElementSibling, container.nextElementSibling].find(r => r != null)
        if (resizer !== undefined) {
            resizer.remove()
        }
        container.remove()
        this.containers--
    }

    dragTab(e, tab) {
        this.dragActiveTab = tab
    }

    resizerMouseDown(e, resizer) {
        this.activeResizer = resizer
        this.resizerStartX = e.clientX
        this.resizerCorrection = 0
        this.resizerStartWidths = new Map()
        for (const c of [...this.children].filter(e => e instanceof Container)) {
            this.resizerStartWidths.set(c, c.getBoundingClientRect().width)
        }
        this.resizerLeft = resizer.previousElementSibling
        this.resizerRight = resizer.nextElementSibling
        document.addEventListener('mousemove', this.resizerMouseMoveFn = e => this.resizerMouseMove(e))
        document.addEventListener('mouseup', e => this.resizerMouseUp(e))
        document.body.style.cursor = 'e-resize';
    }

    resizerMouseUp(e) {
        document.removeEventListener('mousemove', this.resizerMouseMoveFn)
        document.body.style.removeProperty('cursor')
    }

    resizerMouseMove(e) {
        let leftWidth = 0, rightWidth = 0

        if (this.resizerLeft == this.activeResizer.previousElementSibling) {
            leftWidth = this.resizerStartWidths.get(this.resizerLeft) + e.clientX - this.resizerStartX
            rightWidth = this.resizerStartWidths.get(this.resizerRight) - (leftWidth - this.resizerStartWidths.get(this.resizerLeft) - this.resizerCorrection)
        } else {
            rightWidth = this.resizerStartWidths.get(this.resizerRight) - (e.clientX - this.resizerStartX)
            leftWidth = this.resizerStartWidths.get(this.resizerLeft) - (rightWidth - this.resizerStartWidths.get(this.resizerRight) - this.resizerCorrection)
        }

        let setLeft = true, setRight = true

        if (leftWidth <= 200 && this.resizerLeft.previousElementSibling == null) {
            setRight = false
        } else if (rightWidth <= 200 && this.resizerRight.nextElementSibling == null) {
            setLeft = false
        }

        if (setLeft) {
            if (leftWidth < 200) {
                this.resizerLeft.style.width = '200px'
                if (this.resizerLeft.previousElementSibling != null) {
                    this.resizerCorrection += this.resizerStartWidths.get(this.resizerLeft) - 200
                    this.resizerLeft = this.resizerLeft.previousElementSibling.previousElementSibling
                }
            } else if (this.resizerLeft != this.activeResizer.previousElementSibling && leftWidth > this.resizerStartWidths.get(this.resizerLeft)) {
                this.resizerLeft.style.width = `${this.resizerStartWidths.get(this.resizerLeft)}px`
                this.resizerLeft = this.resizerLeft.nextElementSibling.nextElementSibling
                this.resizerCorrection -= this.resizerStartWidths.get(this.resizerLeft) - 200
            } else {
                this.resizerLeft.style.width = `${leftWidth}px`
            }
        }
        
        if (setRight) {
            if (rightWidth < 200) {
                this.resizerRight.style.width = '200px'
                if (this.resizerRight.nextElementSibling != null) {
                    this.resizerCorrection += this.resizerStartWidths.get(this.resizerRight) - 200
                    this.resizerRight = this.resizerRight.nextElementSibling.nextElementSibling
                }
            } else if (this.resizerRight != this.activeResizer.nextElementSibling && rightWidth > this.resizerStartWidths.get(this.resizerRight)) {
                this.resizerRight.style.width = `${this.resizerStartWidths.get(this.resizerRight)}px`
                this.resizerRight = this.resizerRight.previousElementSibling.previousElementSibling
                this.resizerCorrection -= this.resizerStartWidths.get(this.resizerRight) - 200
            } else {
                this.resizerRight.style.width = `${rightWidth}px`
            }
        }

    }

}

class Chat extends HTMLElement {

    static element  = 'split-chat'

    static new(content) {
        let chat = document.createElement(Chat.element)
        chat.textContent = content
        return chat
    }

    constructor() {
        super()
    }

}

var elements = [
    Chat, Tab, ChatBar, Container, Resizer, SplitView
]

elements.forEach(_class => customElements.define(_class.element, _class))
