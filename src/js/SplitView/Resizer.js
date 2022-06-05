import { htmlToElement } from "../common.js"

export class Resizer extends HTMLElement {

    static elementTag = 'split-resizer'

    static new() {
        let resizer = document.createElement(Resizer.elementTag)
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

    disconnectedCallback() {
        this.splitView = null
    }

}
