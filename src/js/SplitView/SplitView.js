import { Container } from "./Container.js"
import { Resizer } from "./Resizer.js"

export class SplitView extends HTMLElement {

    static elementTag = 'split-view'

    static new() {
        return document.createElement(SplitView.elementTag)
    }

    constructor() {
        super()

        this.dragActiveTab = null
        this.activeResizer = null

        this.resizerStartX = null
        this.resizerStartWidths = null
        this.resizerLeft = null
        this.resizerRight = null
        this.resizerCorrection = 0
    }

    _updateContainerWidths() {
        for (const [c, w] of [...this.children].filter(e => e instanceof Container).map(e => [e, e.getBoundingClientRect().width])) {
            c.style.width = `${w}px`
        }
    }

    _appendContainer(container) {
        if (this.children.length > 0) {
            this.appendChild(Resizer.new())
        }
        this.appendChild(container)
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
        } else {
            this._appendContainer(container)
        }
    }

    moveContainer(container, where) {
        if ('next' in where) {
            this.removeContainer(container)
            this.insertBefore(container, where.next)
            this.insertBefore(Resizer.new(), where.next)
        } else if ('previous' in where) {
            this.removeContainer(container)
            if (where.previous.nextElementSibling != null) {
                let next = where.previous.nextElementSibling.nextElementSibling
                this.insertBefore(container, next)
                this.insertBefore(Resizer.new(), next)
            } else {
                this._appendContainer(container)
            }
        }
    }

    removeContainer(container) {
        let resizer = [container.previousElementSibling, container.nextElementSibling].find(r => r != null)
        if (resizer !== undefined) {
            resizer.remove()
        }
        container.remove()
    }

    dragTab(e, tab) {
        this.dragActiveTab = tab
    }

    dropTab(destContainer) {
        let srcContainer = this.dragActiveTab.container

        let destWidth = destContainer.getBoundingClientRect().width
        let srcWidth = srcContainer.getBoundingClientRect().width

        srcContainer.removeTab(this.dragActiveTab)

        if (srcContainer.splitView == null) {
            destContainer.style.width = `${destWidth + srcWidth + 2}px`
        }

        destContainer.appendTab(this.dragActiveTab)
    }

    splitContainer(where) {
        if (this.dragActiveTab.container.tabs == 1) {
            this.moveContainer(this.dragActiveTab.container, where)
        } else {
            let newContainer = Container.new()
            this.dragActiveTab.container.removeTab(this.dragActiveTab)
            this.insertContainer(newContainer, where)
            newContainer.appendTab(this.dragActiveTab)
        }
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
            rightWidth = this.resizerStartWidths.get(this.resizerRight) - (200 - this.resizerStartWidths.get(this.resizerLeft) - this.resizerCorrection)
        } else if (rightWidth <= 200 && this.resizerRight.nextElementSibling == null) {
            leftWidth = this.resizerStartWidths.get(this.resizerLeft) - (200 - this.resizerStartWidths.get(this.resizerRight) - this.resizerCorrection)
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
