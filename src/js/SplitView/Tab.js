export class Tab extends HTMLElement {

    static elementTag = 'split-chat-tab'

    static new(title, chat) {
        let tab = document.createElement(Tab.elementTag)
        
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
        this.addEventListener('dragend', e => this.container.dragEndTab(e, this))
    }
    
    connectedCallback() {
        this.container = this.parentElement.parentElement
        this.chat.container = this.container
    }

    disconnectedCallback() {
        this.container = null
        this.chat.container = null
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
