import { htmlToElement } from "../common.js"

class TextField {

    static new(name) {
        let container = htmlToElement('<div class="field-container textfield-container"></div>')
        container.appendChild(htmlToElement(`<span class="field-name textfield-name">${name}</span>`))
        container.appendChild(htmlToElement(`<input type="text" spellcheck="false" class="textfield-input">`))
        return container
    }

}

class CheckGroupField {

    static new(name, options) {
        let container = htmlToElement('<div class="field-container checkgroup-container"></div>')
        container.appendChild(htmlToElement(`<span class="field-name checkgroup-name">${name}</span>`))
        let optionContainer = htmlToElement('<div class="checkgroup-option-container"></div>')
        for (const option of options) {
            let oe = htmlToElement(`<div class="checkgroup-option" name="${option}">${option}</div>`)
            oe.addEventListener('click', e => oe.classList.toggle('checked'))
            optionContainer.appendChild(oe)
        }
        container.appendChild(optionContainer)
        return container
    }

}

export class NewTabDialog extends HTMLElement {

    static elementTag = 'new-tab-dialog'

    static new() {
        let newTabDialog = document.createElement(NewTabDialog.elementTag)
        newTabDialog.appendChild(TextField.new('Channel'))
        // newTabDialog.appendChild(CheckGroupField.new('Include', ['Server messages', 'Moderation actions', 'User messages', 'Threads and replies']))
        let join = htmlToElement('<div class="new-tab-button">JOIN</div>')
        let save = htmlToElement('<div class="new-tab-button save" contenteditable="false">SAVE</div>')
        save.addEventListener('mousedown', e => {
            if (save.getAttribute('contenteditable') == 'true') {
                return
            }
            save.setAttribute('contenteditable', 'true')
            save.textContent = ""
            save.focus()
        })
        save.addEventListener('focusout', e => {
            save.setAttribute('contenteditable', 'false')
            save.textContent = "SAVE"
        })
        join.addEventListener('click', e => newTabDialog.join())
        let bg = htmlToElement('<div class="checkgroup-option-container"></div>')
        bg.appendChild(join)
        bg.appendChild(save)
        newTabDialog.appendChild(bg)

        return newTabDialog
    }

    constructor() {
        super()
    }

    join() {
        this.container.finishAddTab(
            {
                'channel': `#${this.getElementsByClassName('textfield-input')[0].value.toLowerCase()}`
            }
        )
    }

}
