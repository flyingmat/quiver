export class SevenTV {

    static URL_API = 'https://api.7tv.app/v2'

    static URL_GET_GLOBAL_EMOTES = SevenTV.URL_API + '/emotes/global'
    static URL_GET_CHANNEL_EMOTES = SevenTV.URL_API + '/users/:user/emotes'

    constructor() {
        this.emoteProvider = SevenTVEmoteProvider
    }

    getGlobalEmotes() {
        return fetch(SevenTV.URL_GET_GLOBAL_EMOTES)
    }

    getChannelEmotes(channel) {
        return fetch(SevenTV.URL_GET_CHANNEL_EMOTES.replace(':user', channel))
    }

}

class SevenTVEmoteProvider {

    static PROVIDER_NAME = 'SevenTV'

    static buildEmoteURLs(emote) {
        let urls = emote.urls.reduce((obj, u) => {
            obj[u[0]] = u[1]
            return obj
        }, {})

        let url_1x = urls['1']
        let srcset = Object.entries(urls).map(([s, u]) => `${u} ${s}x`).join(', ')

        return {
            'src': url_1x,
            'srcset': srcset
        }
    }

    static formatEmotes(emotes) {
        return emotes.reduce((obj, e) => {
            e['_QVR_PROVIDER'] = SevenTVEmoteProvider.PROVIDER_NAME
            e['_QVR_URLDATA'] = SevenTVEmoteProvider.buildEmoteURLs(e)
            obj[e.name] = e
            return obj
        }, {})
    }

    constructor(sevenAPI) {
        this.sevenAPI = sevenAPI
    }

    getEmotes(channel) {
        if ((channel ?? '0') === '0') {
            return this.sevenAPI.getGlobalEmotes().then(r => r.json()).then(j => SevenTVEmoteProvider.formatEmotes(j))
        } else {
            return this.sevenAPI.getChannelEmotes(channel).then(r => r.json()).then(j => SevenTVEmoteProvider.formatEmotes(j))
        }
    }

    get name() {
        return SevenTVEmoteProvider.PROVIDER_NAME
    }

}
