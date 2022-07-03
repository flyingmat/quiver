import { TwitchWrapper } from "../API/Twitch.js"
import { htmlToElement } from "../common.js"
import { Emote } from "./Emote.js"

export class Message extends HTMLElement {

    static elementTag = 'chat-message-container'

    // static newEmote(emote, name) {
    //     let emoteContainer = htmlToElement('<div class="chat-message-emote-container"></div>')
    //     let img = htmlToElement(`<img src="${emote['_QVR_URLDATA'].src}" srcset="${emote['_QVR_URLDATA'].srcset}" class="chat-message-emote" draggable="false" alt="${name}">`)
    //     img.addEventListener('mouseenter', (e) => {
    //         document.body.appendChild(htmlToElement(`<div class="chat-message-emote-tip" id="emote-tip"><img src="${emote['_QVR_URLDATA'].src}" class="chat-message-emote" draggable="false"><div><span>${name}</span><span class="emote-tip-provider">${emote['_QVR_PROVIDER']}</span></div></div>`))
    //     })
    //     img.addEventListener('mousemove', (e) => {
    //         let tip = document.getElementById('emote-tip')
    //         if (tip != null) {
    //             let r = tip.getBoundingClientRect()
    //             // console.log(e.pageX - r.width / 2)
    //             // console.log(e.pageY - r.height - 2)
    //             tip.style.left = `${e.pageX - r.width / 2}px`
    //             tip.style.top = `${e.pageY - r.height - 10}px`
    //             // console.log(tip)
    //         }
    //     })
    //     img.addEventListener('mouseleave', (e) => {
    //         document.getElementById('emote-tip').remove()
    //     })
    //     emoteContainer.appendChild(img)

    //     return emoteContainer
    // }

    static new(message, emotes, emojis) {
        let messageContainer = document.createElement(Message.elementTag)

        if (message.type == 'PRIVMSG') {
            const date = new Date(Number(message.tags['tmi-sent-ts']))
            let messageTimestamp = htmlToElement('<span class="chat-message-timestamp"></span>')
            messageTimestamp.textContent = date.getHours().toString().padStart(2, "0") + ":" + date.getMinutes().toString().padStart(2, "0") + ":" + date.getSeconds().toString().padStart(2, "0")

            let messageTextContainer = htmlToElement('<div class="chat-text-container"></div>')
            let userElement = htmlToElement('<span class="chat-message-user"></span>')
            userElement.textContent = [message.tags['display-name'], message.user].find(s => s != '')

            if (message.tags.color !== '') {
                const color = tinycolor(message.tags.color);
                userElement.style.color = color.brighten(40).toHexString();
            }

            let messageEmotes = {}

            if (message.tags.emotes !== '') {
                message.tags.emotes.split('/').forEach(e => {
                    let emoteData = e.split(':')
                    let id = emoteData[0]
                    let positions = emoteData[1].split(',')
                    positions.forEach(p => {
                        // emote positions cannot overlap
                        let [pStart, pEnd] = p.split('-').map(n => parseInt(n))
                        messageEmotes[pStart] = [pEnd, id]
                    })
                })
            }

            // always start content with a space (better for wrapping i think)
            let messageElement = htmlToElement('<span class="chat-message-content"></span>')
            let textBuffer = ' ', wordBuffer = '', i = 0

            // fix for unicode chars e.g. emojis
            let content = [...message.content]

            // console.log(message.content)
            // console.log(content)

            if (message.content.startsWith("\u0001ACTION")) {
                content = content.slice(8, -1);
                messageContainer.classList.add('action')
            }

            while (i < content.length) {
                // handle native twitch emotes, embedded in irc tags
                if (i in messageEmotes) {
                    // assume emotes always start after a space (ie don't care about wordbuffer here)
                    messageElement.appendChild(htmlToElement(`<span class="chat-message-text">${textBuffer}</span>`))
                    textBuffer = ' '
                    messageElement.appendChild(Emote.new({
                        '_QVR_URLDATA': TwitchWrapper.buildEmoteURLs(messageEmotes[i][1]),
                        '_QVR_PROVIDER': 'Twitch'
                    }, content.slice(i, messageEmotes[i][0] + 1).join('')))
                    i = messageEmotes[i][0]
                } else {
                    let c = content.at(i)

                    if (c === ' ') {
                        // handle third-party emotes
                        if (wordBuffer in emotes) {
                            messageElement.appendChild(htmlToElement(`<span class="chat-message-text">${textBuffer}</span>`))
                            textBuffer = ' '
                            messageElement.appendChild(Emote.new(emotes[wordBuffer], wordBuffer))
                        } else if (/^\p{Extended_Pictographic}$/u.test(wordBuffer)) {
                            let uc = wordBuffer.codePointAt(0).toString(16)
                            messageElement.appendChild(htmlToElement(`<span class="chat-message-text">${textBuffer}</span>`))
                            textBuffer = ' '
                            messageElement.appendChild(Emote.new({
                                '_QVR_URLDATA': {
                                    'src': emojis[uc].src,
                                    'srcset': ''
                                },
                                '_QVR_PROVIDER': 'Emojis'
                            }, `:${emojis[uc].shortcode}:`, true))
                        } else {
                            textBuffer += `${wordBuffer} `
                        }
                        wordBuffer = ''
                    } else {
                        wordBuffer += content.at(i)
                    }
                }

                i++
            }

            if (wordBuffer in emotes) {
                messageElement.appendChild(htmlToElement(`<span class="chat-message-text">${textBuffer}</span>`))
                messageElement.appendChild(Emote.new(emotes[wordBuffer], wordBuffer))
            } else if (/^\p{Extended_Pictographic}$/u.test(wordBuffer)) {
                let uc = wordBuffer.codePointAt(0).toString(16)
                messageElement.appendChild(htmlToElement(`<span class="chat-message-text">${textBuffer}</span>`))
                messageElement.appendChild(Emote.new({
                    '_QVR_URLDATA': {
                        'src': emojis[uc].src,
                        'srcset': ''
                    },
                    '_QVR_PROVIDER': 'Emojis'
                }, `:${emojis[uc].shortcode}:`, true))
            } else {
                textBuffer += `${wordBuffer}`
                if (textBuffer.trim().length > 0) {
                    messageElement.appendChild(htmlToElement(`<span class="chat-message-text">${textBuffer}</span>`))
                }
            }

            messageContainer.appendChild(messageTimestamp)
            messageTextContainer.appendChild(userElement)
            messageTextContainer.appendChild(messageElement)
            messageContainer.appendChild(messageTextContainer)
        } else if (message.type == 'CLEARCHAT') {
            const date = new Date(Number(message.tags['tmi-sent-ts']))
            let messageTimestamp = htmlToElement('<span class="chat-message-timestamp"></span>')
            messageTimestamp.textContent = date.getHours().toString().padStart(2, "0") + ":" + date.getMinutes().toString().padStart(2, "0") + ":" + date.getSeconds().toString().padStart(2, "0")

            let messageTextContainer = htmlToElement('<div class="chat-text-container"></div>')
            let messageElement = htmlToElement('<span class="chat-message-content raw"></span>')
            if ('ban-duration' in message.tags) {
                let tm = parseInt(message.tags['ban-duration'])
                let ts = []
                if (tm > 3600) {
                    let rm = tm % 3600
                    let hours = (tm - rm) / 3600
                    ts.push(`${hours} hours`)
                    tm = rm
                }
                if (tm > 60) {
                    let rm = tm % 60
                    let minutes = (tm - rm) / 60
                    ts.push(`${minutes} minutes`)
                    tm = rm
                }
                if (tm > 0) {
                    ts.push(`${tm} seconds`)
                }

                if (ts.length > 1) {
                    messageElement.textContent = `${message.user} has been timed out for ${ts.slice(0, -1).join(', ')} and ${ts.at(-1)}.`
                } else {
                    messageElement.textContent = `${message.user} has been timed out for ${ts.at(0)}.`
                }
            } else {
                messageElement.textContent = `${message.user} has been permanently banned.`
            }

            messageContainer.appendChild(messageTimestamp)
            messageTextContainer.appendChild(messageElement)
            messageContainer.appendChild(messageTextContainer)
        } else {
            const date = new Date()
            let messageTimestamp = htmlToElement('<span class="chat-message-timestamp"></span>')
            messageTimestamp.textContent = date.getHours().toString().padStart(2, "0") + ":" + date.getMinutes().toString().padStart(2, "0") + ":" + date.getSeconds().toString().padStart(2, "0")
            
            let messageTextContainer = htmlToElement('<div class="chat-text-container"></div>')
            let messageElement = htmlToElement('<span class="chat-message-content raw"></span>')
            messageElement.textContent = message.content
    
            messageContainer.appendChild(messageTimestamp)
            messageTextContainer.appendChild(messageElement)
            messageContainer.appendChild(messageTextContainer)
        }

        // messageContainer.style.setProperty('--m-line-height', `${h}px`)

        return messageContainer
    }

    constructor() {
        super()
    }

}
