export class FrankerFaceZ {

    static URL_API = 'https://api.frankerfacez.com/v1'

    static URL_GET_GLOBAL_EMOTES = FrankerFaceZ.URL_API + '/set/global'
    static URL_GET_CHANNEL_EMOTES = FrankerFaceZ.URL_API + '/room/id'

    constructor() {
        this.emoteProvider = FrankerFaceZEmoteProvider
    }

    getGlobalEmotes() {
        return fetch(FrankerFaceZ.URL_GET_GLOBAL_EMOTES)
    }

    getChannelEmotes(broadcaster_id) {
        return fetch(`${FrankerFaceZ.URL_GET_CHANNEL_EMOTES}/${broadcaster_id}`)
    }

}

export class FrankerFaceZEmoteProvider {

    static PROVIDER_NAME = 'FrankerFaceZ'

    static buildEmoteURLs(emote) {
        let url_1x = `https:${emote.urls['1']}`
        let srcset = Object.entries(emote.urls).map(([s, u]) => `https:${u} ${s}x`).join(', ')

        return {
            'src': url_1x,
            'srcset': srcset
        }
    }

    static formatEmotes(emotes) {
        return emotes.reduce((obj, emote) => {
            emote['_QVR_PROVIDER'] = FrankerFaceZEmoteProvider.PROVIDER_NAME
            emote['_QVR_URLDATA'] = FrankerFaceZEmoteProvider.buildEmoteURLs(emote)
            obj[emote['name']] = emote
            return obj
        }, {})
    }

    constructor(ffzAPI) {
        this.ffzAPI = ffzAPI
    }

    getEmotes(broadcaster_id) {
        if ((broadcaster_id ?? '0') === '0') {
            return this.ffzAPI.getGlobalEmotes().then(r => r.json())
                .then(j => FrankerFaceZEmoteProvider.formatEmotes(j['default_sets'].map(set_id => j['sets'][set_id.toString()]['emoticons']).flat()))
        } else {
            return this.ffzAPI.getChannelEmotes(broadcaster_id).then(r => r.json())
                .then(j => FrankerFaceZEmoteProvider.formatEmotes(j['sets'][j['room']['set'].toString()]['emoticons']))
        }
    }

    get name() {
        return FrankerFaceZEmoteProvider.PROVIDER_NAME
    }

}
