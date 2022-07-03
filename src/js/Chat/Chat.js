import { htmlToElement } from "../common.js"
import { Emote } from "./Emote.js"
import { Message } from "./Message.js"

export class EmotePane extends HTMLElement {

    static elementTag = 'emote-pane'

    static new(channel) {
        let pane = document.createElement(EmotePane.elementTag)
        pane.classList.add('chat-pane', 'hidden')
        pane.channel = channel

        let titleRow = htmlToElement('<div class="title-container"></div>')

        titleRow.appendChild(htmlToElement('<div class="svg-button open"><img src="../assets/open.svg" width="10" height="10"></div>'))
        titleRow.appendChild(htmlToElement(`<span>emotes:${channel}</span>`))

        pane.appendChild(titleRow)

        return pane
    }

    static newEmoteContainer(set, avail) {
        let container = htmlToElement('<div class="row"></div>')
        for (const [name, emote] of Object.entries(set)) {
            let em = Emote.new(emote, name)
            if (avail !== undefined && !(name in avail)) {
                em.classList.add('unavailable')
            }
            container.appendChild(em)
        }

        return container
    }

    constructor() {
        super()
    }

    initSets(emoteSets) {
        let byOwner = Object.entries(emoteSets).reduce((obj, [id, set]) => {
            if (!(set['owner_id'] in obj)) {
                obj[set['owner_id']] = {
                    'owner': null,
                    'sets': {}
                }
                obj[set['owner_id']].owner = set.owner
            }
            obj[set['owner_id']].sets[id] = set
            return obj
        }, {})
        
        console.log(byOwner)

        this.appendChild(htmlToElement('<div class="row emote-pane-content"></div>'))
        this.lastChild.appendChild(htmlToElement('<div class="column emote-pane-owners"></div>'))
        this.lastChild.appendChild(htmlToElement('<div class="column emote-pane-list"></div>'))

        for (const [owner_id, data] of Object.entries(byOwner)) {
            if (owner_id === 'undefined' || owner_id === '0' || owner_id === '139075904') {
                continue
            } else {
                let ownerImage = htmlToElement(`<img src="${data.owner['profile_image_url']}" width="40" height="40">`)
                this.lastChild.firstChild.appendChild(ownerImage)
                let sets = htmlToElement('<div class="column sets"></div>')
                for (const [set_id, set] of Object.entries(data.sets)) {
                    let setContainer = htmlToElement('<div class="column set"></div>')
                    setContainer.appendChild(htmlToElement(`<span>${set_id}</span>`))
                    setContainer.appendChild(EmotePane.newEmoteContainer(set.emotes))
                    sets.appendChild(setContainer)
                }
                this.lastChild.lastChild.appendChild(sets)
            }
        }

        let global = {}

        if ('0' in byOwner) {
            Object.assign(global, byOwner['0'].sets)
        }

        if ('139075904' in byOwner) {
            Object.assign(global, byOwner['139075904'].sets)
        }

        let ownerImage = htmlToElement('<div></div>')
        this.lastChild.firstChild.appendChild(ownerImage)

        let sets = htmlToElement('<div class="column sets"></div>')
        for (const [set_id, set] of Object.entries(global)) {
            let setContainer = htmlToElement('<div class="column set"></div>')
            setContainer.appendChild(htmlToElement(`<span>${set_id}</span>`))
            setContainer.appendChild(EmotePane.newEmoteContainer(set.emotes))
            sets.appendChild(setContainer)
        }
        this.lastChild.lastChild.appendChild(sets)

        // for (const [id, set] of Object.entries(emoteSets)) {
        //     if (Object.keys(set).length > 0) {
        //         let setContainer = htmlToElement('<div class="set"></div>')
        //         setContainer.appendChild(htmlToElement(`<span>${Object.values(set)[0]['owner_id']}:${id}</span>`))
        //         setContainer.appendChild(EmotePane.newEmoteContainer(set))
        //         this.lastChild.appendChild(setContainer)
        //     }
        // }
    }

    async init(emoteSets, channelEmotes, globalEmotes) {
        console.log(emoteSets)
        console.log(channelEmotes)
        console.log(globalEmotes)
        
        let avail = Object.values(emoteSets).reduce((obj, set) => {
            Object.assign(obj, set.emotes)
            return obj
        }, {})

        console.log(avail)

        let all = htmlToElement('<div class="column"></div>')

        if ('' in channelEmotes['Twitch']) {
            let allNoTier = {}

            for (const [name, emote] of Object.entries(channelEmotes['Twitch'][''])) {
                if (!(emote['emote_type'] in allNoTier)) {
                    allNoTier[emote['emote_type']] = {}
                }
                allNoTier[emote['emote_type']][name] = emote
            }

            for (const [type, emotes] of Object.entries(allNoTier)) {
                let cont = htmlToElement('<div class="column"></div>')
                cont.appendChild(htmlToElement(`<span>${type}</span>`))
                cont.appendChild(EmotePane.newEmoteContainer(emotes, avail))
                all.appendChild(cont)
            }
        }

        for (const [tier, emotes] of Object.entries(channelEmotes['Twitch'])) {
            if (tier === '') {
                continue
            }
            
            let cont = htmlToElement('<div class="column"></div>')
            cont.appendChild(htmlToElement(`<span>Tier ${tier.slice(0,1)}</span>`))
            cont.appendChild(EmotePane.newEmoteContainer(emotes, avail))
            all.appendChild(cont)
        }

        for (const [provider, emotes] of Object.entries(channelEmotes)) {
            if (provider === 'Twitch') {
                continue
            }

            let cont = htmlToElement('<div class="column"></div>')
            cont.appendChild(htmlToElement(`<span>${this.channel}:${provider}</span>`))
            cont.appendChild(EmotePane.newEmoteContainer(emotes))
            all.appendChild(cont)
        }

        for (const [provider, emotes] of Object.entries(globalEmotes)) {
            if (provider === 'Twitch') {
                continue
            }

            let cont = htmlToElement('<div class="column"></div>')
            cont.appendChild(htmlToElement(`<span>Global:${provider}</span>`))
            cont.appendChild(EmotePane.newEmoteContainer(emotes))
            all.appendChild(cont)
        }

        let byOwner = Object.entries(emoteSets).reduce((obj, [id, set]) => {
            if (!(set['owner_id'] in obj)) {
                obj[set['owner_id']] = {
                    'owner': null,
                    'sets': {}
                }
                obj[set['owner_id']].owner = set.owner
            }
            obj[set['owner_id']].sets[id] = set
            return obj
        }, {})

        for (const [owner_id, data] of Object.entries(byOwner)) {
            if (owner_id !== 'undefined' && owner_id !== '0' && owner_id !== '139075904' && `#${data.owner.login}` !== this.channel) {
                for (const [set_id, set] of Object.entries(data.sets)) {
                    let cont = htmlToElement('<div class="column"></div>')
                    cont.appendChild(htmlToElement(`<span>${set_id} (${owner_id}) - ${data.owner['display_name']}:${Object.values(set.emotes)[0]['emote_type']}</span>`))
                    cont.appendChild(EmotePane.newEmoteContainer(set.emotes))
                    all.appendChild(cont)
                }
            }
        }

        for (const [owner_id, data] of Object.entries(byOwner)) {
            if (owner_id === '0' || owner_id === '139075904') {
                if (owner_id === '0') {
                    data.owner = {
                        'display_name': 'tmi'
                    }
                }
                for (const [set_id, set] of Object.entries(data.sets)) {
                    let cont = htmlToElement('<div class="column"></div>')
                    cont.appendChild(htmlToElement(`<span>${set_id} (${owner_id}) - ${data.owner['display_name']}:${Object.values(set.emotes)[0]['emote_type']}</span>`))
                    cont.appendChild(EmotePane.newEmoteContainer(set.emotes))
                    all.appendChild(cont)
                }
            }
        }

        this.appendChild(all)
    }

}

export class ChatBox extends HTMLElement {

    static elementTag = 'chat-box'

    static new(chat) {
        let _this = document.createElement(ChatBox.elementTag)
        _this.classList.add('chat-pane')

        // _this.appendChild((_this.input = htmlToElement('<input type="text">'), _this.input))
        _this.appendChild((_this.input = htmlToElement('<div contenteditable="false" spellcheck="false" class="chatbox-input"><div contenteditable="true" class="chatbox-content"></div></div>'), _this.input))
        _this.input.firstChild.appendChild(document.createTextNode('\u200b'))
        _this.input.firstChild.appendChild(document.createTextNode('\u200b'))
        _this.appendChild((_this.emoteButton = htmlToElement('<div class="svg-button emotes"><img src="../assets/emotes.svg" width="20" height="20"></div>'), _this.emoteButton))
        
        _this.chat = chat

        // _this.emoteButton.addEventListener('click', () => {
        //     _this.chat.epane.classList.toggle('hidden')
        // })

        _this.input.firstChild.addEventListener('keydown', e => _this.onKeyDown(e))
        _this.input.firstChild.addEventListener('paste', e => _this.onPaste(e))
        // _this.input.firstChild.addEventListener('paste', e => {
        //     e.preventDefault()
        //     // let text = (e.originalEvent || e).clipboardData.getData('text/plain');
        //     let htmlText = e.clipboardData.getData('text/html')
        //     let fixedHtml = htmlText.split('<!--StartFragment-->').at(1).split('<!--EndFragment-->').at(0)
        //     fixedHtml = fixedHtml.replaceAll(new RegExp("style=\".*?\"", 'g'), '')
        //     fixedHtml = fixedHtml.replaceAll(new RegExp("<br.*?>", 'g'), '')
        //     fixedHtml = fixedHtml.replaceAll(new RegExp("</?span>", 'g'), '')
        //     console.log(fixedHtml)
        //     let html = htmlToElement('<div>' + fixedHtml + '</div>')
        //     console.log(html)

        //     const selection = window.getSelection()
        //     if (!selection.rangeCount) return
        //     selection.deleteFromDocument()
        //     for (const n of [...html.children]) {
        //         selection.getRangeAt(0).insertNode(n)
        //         selection.collapseToEnd()
        //     }
        // })

        return _this
    }

    constructor() {
        super()

        this.chat = null
        this.input = null
        this.emoteButton = null

        this.suggestion = null
        this.suggestionWord = null
    }

    _correctSelection() {
        let s = window.getSelection()
        if (s.rangeCount === 0) return

        let r = s.getRangeAt(0)

        let nodes = [...this.input.firstChild.childNodes], r2 = document.createRange()

        if (r.collapsed) {
            if (r.startContainer === nodes.at(0) && r.startOffset === 0) {
                s.collapse(r.startContainer, 1)
            } else if (r.startContainer === nodes.at(-1) && r.startOffset === r.startContainer.data.length) {
                s.collapse(r.startContainer, r.startOffset - 1)
            }
        } else {
            // ctrl+a when no emotes
            if (r.commonAncestorContainer === this.input.firstChild && nodes.length === 2) {
                r2.setStart(nodes.at(0), 1)
                r2.setEnd(nodes.at(-1), nodes.at(-1).data.length - 1)
            } else {
                if (r.startContainer === nodes.at(0) && r.startOffset === 0) {
                    r2.setStart(r.startContainer, 1)
                } else {
                    r2.setStart(r.startContainer, r.startOffset)
                }
    
                if (r.endContainer === nodes.at(-1) && r.endOffset === r.endContainer.data.length) {
                    r2.setEnd(r.endContainer, r.endOffset - 1)
                } else {
                    r2.setEnd(r.endContainer, r.endOffset)
                }
            }

            s.removeAllRanges()
            s.addRange(r2)
        }

        this.selection = s
    }

    _tryCaretLeft(e) {
        let r = window.getSelection().getRangeAt(0)
        let nodes = [...this.input.firstChild.childNodes]

        if (r.collapsed) {
            if (r.startContainer === nodes.at(0) && r.startOffset === 1) {
                e.preventDefault()
            }
        } else {
            this._correctSelection()
        }
    }

    _tryCaretRight(e) {
        let r = window.getSelection().getRangeAt(0)
        let nodes = [...this.input.firstChild.childNodes]

        if (r.collapsed) {
            if (r.startContainer === nodes.at(-1) && r.startOffset === r.startContainer.data.length - 1) {
                e.preventDefault()
            } else if (r.startContainer === nodes.at(-2) && r.startOffset === r.startContainer.data.length && nodes.at(-1).data === '\u200b') {
                e.preventDefault()
            }
        } else {
            this._correctSelection()
        }
    }

    _onTab(e) {
        e.preventDefault()
        let s = window.getSelection(), r = s.getRangeAt(0)

        if (!r.collapsed) return

        if (this.suggestion === null) {
            let suggestions = this.chat.suggestionPane.setSuggestions((this.suggestionWord = this.getWord(), this.suggestionWord))
            if (suggestions.length > 0) {
                let suggestion = this.chat.suggestionPane.selectSuggestion(0)

                let split = s.anchorNode.splitText(s.anchorOffset - this.suggestionWord.length)
                split.data = ' ' + split.data.slice(this.suggestionWord.length)
                this.input.firstChild.insertBefore((this.suggestion = Emote.new(suggestion.emote, suggestion.name), this.suggestion.setAttribute('contenteditable', 'false'), this.suggestion), split)

                s.collapse(split, 1)
            }
        } else {
            let prevSuggestion = this.suggestion, suggestion = this.chat.suggestionPane.shiftSuggestion(e.shiftKey ? -1 : 1)
            this.input.firstChild.replaceChild((this.suggestion = Emote.new(suggestion.emote, suggestion.name), this.suggestion.setAttribute('contenteditable', 'false'), this.suggestion), prevSuggestion)
        }
    }

    _onArrowLeft(e) {
        this._tryCaretLeft(e)
    }

    _onArrowRight(e) {
        this._tryCaretRight(e)
    }

    _onBackspace(e) {
        let s = window.getSelection(), r = s.getRangeAt(0)
        if (e.ctrlKey && r.collapsed && r.startContainer.data.match(/^\u200b +$/u)) {
            e.preventDefault()
            r.startContainer.data = '\u200b'
            s.collapse(r.startContainer, 1)
        } else {
            this._tryCaretLeft(e)
        }
    }

    _onDelete(e) {
        let s = window.getSelection(), r = s.getRangeAt(0)
        if (e.ctrlKey && r.collapsed && r.startContainer.data.match(/^ +\u200b$/u)) {
            e.preventDefault()
            r.startContainer.data = '\u200b'
            s.collapse(r.startContainer, 0)
        } else {
            this._tryCaretRight(e)
        }
    }

    onPaste(e) {
        e.preventDefault()

        let htmlText = e.clipboardData.getData('text/html')
        let fixedHtml = htmlText.split('<!--StartFragment-->').at(1).split('<!--EndFragment-->').at(0)
        fixedHtml = fixedHtml.replaceAll(new RegExp("style=\".*?\"", 'g'), '')
        fixedHtml = fixedHtml.replaceAll(new RegExp("<br.*?>", 'g'), '')
        fixedHtml = fixedHtml.replaceAll(new RegExp("</?span *>", 'g'), '')
        console.log(fixedHtml)

        let html = htmlToElement('<div>' + fixedHtml + '</div>')
        console.log(html)

        const selection = window.getSelection()
        if (!selection.rangeCount) return

        selection.deleteFromDocument()
        for (const n of [...html.childNodes]) {
            selection.getRangeAt(0).insertNode(n)
            selection.collapseToEnd()
        }
    }

    onKeyDown(e) {
        // let s = window.getSelection()

        // console.log(this.input.firstChild.childNodes)

        // if (this.input.firstChild.childNodes.length === 1 && (!this.input.firstChild.childNodes[0].data.startsWith('\u200b') || this.input.firstChild.childNodes[0].data === '\u200b')) {
        //     this.input.firstChild.childNodes[0].data = '\u200b' + this.input.firstChild.childNodes[0].data
        //     s.collapse(this.input.firstChild.childNodes[0], 1)
        // }

        if (e.key.length === 1 || e.key.startsWith('Arrow') || e.key === 'Backspace' || e.key === 'Delete') {
            if (this.suggestion !== null && e.key === ' ') {
                e.preventDefault()
            }
            this.suggestion = null
            this.suggestionWord = null
            this.chat.suggestionPane.visible = false
        }

        switch (e.key) {
            // handle suggestions/autocomplete
            case 'Tab':
                this._onTab(e)
                break
            // keycodes to match to maintain \u200b chars in bugged contenteditable and state (ctrl+z/y) history
            case 'ArrowLeft':
                this._onArrowLeft(e)
                break
            case 'ArrowRight':
                this._onArrowRight(e)
                break
            case 'Backspace':
                this._onBackspace(e)
                break
            case 'Delete':
                this._onDelete(e)
                break
            default:
                this._correctSelection()
        }
    }

    getWord() {
        let word = '', s = window.getSelection(), pos = s.anchorOffset

        while (pos > 0) {
            let c = s.anchorNode.data.at(--pos)
            if (!c.match(/[a-z0-9]/i)) {
                break
            }
            word = c + word
        }

        return word
    }

}

export class Suggestion extends HTMLElement {

    static elementTag = 'suggestion-item'

    static newEmote(name, emote, match) {
        let _this = document.createElement(Suggestion.elementTag)
        _this.classList.add('emote')
        _this.type = 'emote'
        _this.name = name
        _this.emote = emote
        _this.match = match

        _this.appendChild((_this.suggestionText = htmlToElement('<div class="suggestion-text"></div>'), _this.suggestionText))
        _this.suggestionText.appendChild(htmlToElement(`<span class="suggestion-name">${name}</span>`))
        _this.suggestionText.appendChild(htmlToElement(`<span class="suggestion-provider">(${emote['_QVR_PROVIDER']})</span>`))

        _this.appendChild((_this.emoteElement = Emote.new(emote, name), _this.emoteElement))

        return _this
    }

    constructor() {
        super()

        this.type = null
    }

    get selected() {
        return this.classList.contains('selected')
    }

    set selected(value) {
        if (value) {
            this.classList.add('selected')
        } else {
            this.classList.remove('selected')
        }
    }

}

export class SuggestionPane extends HTMLElement {

    static elementTag = 'suggestion-pane'

    static new(chat) {
        let _this = document.createElement(SuggestionPane.elementTag)
        _this.classList.add('chat-pane')

        _this.appendChild((_this.suggestions = htmlToElement('<div class="suggestions"></div>'), _this.suggestions))

        _this.chat = chat

        _this.visible = false

        return _this
    }

    constructor() {
        super()

        this.chat = null
        this.suggestions = null
        this.selected = null

        // input, tab, none
        this.behavior = 'tab'
    }

    setSuggestions(word) {
        this.suggestions.innerHTML = ''
        this.selected = null

        if (word !== '') {
            let r = new RegExp(word, 'i'), m

            for (const name in this.chat.suggestionEmotes) {
                if ((m = name.match(r)) !== null) {
                    this.suggestions.appendChild(Suggestion.newEmote(name, this.chat.suggestionEmotes[name], m))
                }
            }
        }

        if (this.suggestions.innerHTML == '') {
            this.visible = false
        } else {
            this.visible = true
        }

        return this.suggestions.children
    }

    selectSuggestion(index) {
        let suggestions = [...this.suggestions.children]
        if (this.selected !== null) {
            suggestions.at(this.selected).selected = false
        }

        index = index % suggestions.length
        suggestions.at(index).selected = true

        suggestions.at(index).scrollIntoView({
            'block': 'center',
            'behavior': 'auto'
        })

        this.selected = index

        return suggestions.at(index)
    }

    shiftSuggestion(offset) {
        return this.selected !== null ? this.selectSuggestion(this.selected + offset) : this.selectSuggestion(0)
    }

    set visible(value) {
        this.style.display = value ? 'block' : 'none'
    }

}

export class Chat extends HTMLElement {

    static elementTag  = 'split-chat'

    static new(config) {
        let _this = document.createElement(Chat.elementTag)
        _this.channel = config.channel
        
        _this.appendChild((_this.cont = htmlToElement('<div class="chat-container"></div>'), _this.cont))
        _this.cont.appendChild(htmlToElement('<div class="chat-content"></div>'))
        
        // let epane = EmotePane.new(config.channel)
        // chat.epane = epane
        // chat.appendChild(epane)

        _this.appendChild((_this.suggestionPane = SuggestionPane.new(_this), _this.suggestionPane))
        _this.appendChild((_this.chatBox = ChatBox.new(_this), _this.chatBox))

        _this.cont.addEventListener('scroll', (e) => {
            _this._scrollTop = _this.cont.scrollTop
            if (_this.cont.scrollTop + _this.cont.getBoundingClientRect().height !== _this.cont.scrollHeight) {
                _this.autoScroll = false
            } else {
                _this.autoScroll = true
            }
        })

        _this.style.setProperty('--m-line-height', '26px')

        return _this
    }

    constructor() {
        super()

        this.channel = null

        this.availEmotes = {}
        this.suggestionEmotes = {}
        this.foreignEmotes = {}
        this.emojis = {}

        this.epane = null
        this.chatBox = null
    }

    connectedCallback() {
        requestAnimationFrame(() => {
            if (this.autoScroll) {
                this.scrollBottom()
            } else {
                this.cont.scrollTop = this._scrollTop
            }
        })
    }

    setEmojis(emojiPromise) {
        emojiPromise.then(emojis => {
            this.emojis = emojis
            console.log(emojis)
        })
    }

    onUserState(emoteSetsPromise) {
        this.emoteSetsPromise = emoteSetsPromise
    }

    onRoomState(channelEmotesPromise, globalEmotesPromise) {
        this.globalEmotesPromise = globalEmotesPromise
        this.channelEmotesPromise = channelEmotesPromise

        Promise.all([this.emoteSetsPromise, channelEmotesPromise, globalEmotesPromise]).then(([emoteSets, channelEmotes, globalEmotes]) => {
            // this.epane.init(emoteSets, channelEmotes, globalEmotes)
            
            let nnChannel = Object.entries(channelEmotes).filter(([p, es]) => p !== 'Twitch').map(([p, es]) => es).reduce((obj, es) => {
                Object.assign(obj, es)
                return obj
            }, {})
            
            let nnGlobal = Object.entries(globalEmotes).filter(([p, es]) => p !== 'Twitch').map(([p, es]) => es).reduce((obj, es) => {
                Object.assign(obj, es)
                return obj
            }, {})
            
            this.foreignEmotes = {}
            Object.assign(this.foreignEmotes, nnGlobal, nnChannel)

            this.availEmotes = {}
            Object.assign(this.availEmotes, Object.entries(emoteSets).reduce((obj, [id, set]) => (Object.assign(obj, set.emotes), obj), {}), nnChannel, nnGlobal)

            this.suggestionEmotes = this.availEmotes

            console.log(emoteSets)
            console.log(this.suggestionEmotes)
        })
    }

    scrollBottom() {
        this.cont.scrollTop = this.cont.scrollHeight
    }

    appendMessage(message) {
        let h = 26
        let m = Message.new(message, this.foreignEmotes, this.emojis)
        this.firstChild.firstChild.appendChild(m)
        // let br = m.getBoundingClientRect()
        // console.log(br)
        // m.style.height = `${Math.ceil(br.height)}px`
        if (this.firstChild.firstChild.children.length > 2000) {
            this.firstChild.firstChild.firstChild.remove()
        }
        if (this.autoScroll) {
            this.scrollBottom()
        }
    }

}
