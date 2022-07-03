export class BetterTTV {

    static URL_API = 'https://api.betterttv.net/3'

    static URL_GET_GLOBAL_EMOTES = BetterTTV.URL_API + '/cached/emotes/global'
    static URL_GET_CHANNEL_EMOTES = BetterTTV.URL_API + '/cached/users/twitch'

    constructor() {
        this.emoteProvider = BetterTTVEmoteProvider
    }

    getGlobalEmotes() {
        return fetch(BetterTTV.URL_GET_GLOBAL_EMOTES)
    }

    getChannelEmotes(broadcaster_id) {
        return fetch(`${BetterTTV.URL_GET_CHANNEL_EMOTES}/${broadcaster_id}`)
    }

}

export class BetterTTVEmoteProvider {

    static PROVIDER_NAME = 'BetterTTV'
    static EMOTE_TEMPLATE = 'https://cdn.betterttv.net/emote/{{id}}/{{scale}}'

    static _buildEmoteURL(id, opts = {}) {
        return BetterTTVEmoteProvider.EMOTE_TEMPLATE
            .replace('{{id}}', id)
            .replace('{{scale}}', opts.scale ?? '1x')
    }

    static buildEmoteURLs(id, opts = {}) {
        opts.scale = ''
        let url_base = BetterTTVEmoteProvider._buildEmoteURL(id, opts)

        let url_1x = url_base.concat('1x')

        return {
            'src': url_1x,
            'srcset': `${url_1x} 1x, ${url_base.concat('2x')} 2x, ${url_base.concat('3x')} 4x`
        }
    }

    static formatEmotes(emotes) {
        return emotes.reduce((obj, emote) => {
            emote['_QVR_PROVIDER'] = BetterTTVEmoteProvider.PROVIDER_NAME
            emote['_QVR_URLDATA'] = BetterTTVEmoteProvider.buildEmoteURLs(emote.id)
            obj[emote.code] = emote
            return obj
        }, {})
    }

    constructor(bttvAPI) {
        this.bttvAPI = bttvAPI
    }

    getEmotes(broadcaster_id) {
        if ((broadcaster_id ?? '0') === '0') {
            return this.bttvAPI.getGlobalEmotes().then(r => r.json()).then(j => BetterTTVEmoteProvider.formatEmotes(j))
        } else {
            return this.bttvAPI.getChannelEmotes(broadcaster_id).then(r => r.json()).then(j => {
                const sharedEmotes = BetterTTVEmoteProvider.formatEmotes(j['sharedEmotes'])
                const channelEmotes = BetterTTVEmoteProvider.formatEmotes(j['channelEmotes'])
        
                return Object.assign({}, sharedEmotes, channelEmotes)
            })
        }
    }

    get name() {
        return BetterTTVEmoteProvider.PROVIDER_NAME
    }

}
