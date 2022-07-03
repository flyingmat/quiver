import { htmlToElement } from "../common.js"

export class Emote extends HTMLElement {

    static elementTag = 'chat-emote'

    static new(emote, name, emoji = false) {
        let ec = document.createElement(Emote.elementTag)
        let img = htmlToElement(`<img src="${emote['_QVR_URLDATA'].src}" srcset="${emote['_QVR_URLDATA'].srcset}" class="chat-emote-image" draggable="false" alt="${name}">`)
        
        const onMouseMove = (e) => {
            let tip = document.getElementById('emote-tip')
            if (tip != null) {
                if (ec.tipRect === null) {
                    ec.tipRect = tip.getBoundingClientRect()
                }

                let r = ec.tipRect

                let left = e.pageX - r.width / 2
                let top = e.pageY - r.height - 10

                if (left < 0) {
                    tip.style.setProperty('--arrow-left', `${left}px`)
                    left = 0
                } else if (left > window.innerWidth - r.width) {
                    tip.style.setProperty('--arrow-left', `${left - window.innerWidth + r.width}px`)
                    left = window.innerWidth - r.width
                }

                tip.style.left = `${left}px`
                tip.style.top = `${e.pageY - r.height - 10}px`
            }
        }

        const onMouseLeave = () => {
            document.getElementById('emote-tip').remove()
            ec.removeEventListener('mousemove', onMouseMove)
            ec.removeEventListener('mouseleave', onMouseLeave)
        }

        ec.addEventListener('mouseenter', () => {
            document.body.appendChild(htmlToElement(`<div class="chat-emote-tip" id="emote-tip"><img src="${emote['_QVR_URLDATA'].src}" class="chat-emote-image" draggable="false"><div><span>${name}</span><span class="emote-tip-provider">${emote['_QVR_PROVIDER']}</span></div><div class="chat-emote-tip-arrow"></div></div>`))
            ec.addEventListener('mousemove', onMouseMove)
            ec.addEventListener('mouseleave', onMouseLeave)
        })

        ec.appendChild(img)
        ec.appendChild(htmlToElement(`<span class="emote-text">${name}</span>`))

        if (emoji) {
            ec.classList.add('emoji')
        }

        return ec
    }

    constructor() {
        super()

        this.displayMode = 'image'

        this.tipRect = null
    }

    set displayMode(value) {
        if (value === 'text') {
            this.classList.add('alt')
        } else {
            this.classList.remove('alt')
        }
    }

}