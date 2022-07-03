export class EmoteManager {

    constructor(twitchWrapper, ...emoteProviders) {
        this.twitchWrapper = twitchWrapper
        this.emoteProviders = emoteProviders
        this.cache = {
            'sets': {},
            'ids': {}
        }

        this.emotes = {}
    }

    getEmojis() {
        return fetch('https://api.github.com/emojis').then(r => r.json()).then(j => Object.entries(j).reduce((obj, [sc, url]) => {
            let unicode = url.split('/').at(-1).split('.').at(0)
            let twurl = `https://twemoji.maxcdn.com/v/14.0.2/72x72/${unicode}.png`
            obj[unicode] = {
                'src': twurl,
                'shortcode': sc
            }
            return obj
        }, {}))
    }

    getGlobalEmotes(forceFetch = {}) {
        return this.getChannelEmotes('0', forceFetch)
    }

    getChannelEmotes(broadcaster_id, forceFetch = {}) {
        let channelEmotes = {}
        let emotePromises = []

        if (!(broadcaster_id in this.cache.ids)) {
            this.cache.ids[broadcaster_id] = {}
        }

        if (!('Twitch' in this.cache.ids[broadcaster_id]) || 'Twitch' in forceFetch) {
            let emotePromise = this.twitchWrapper.getEmotes(broadcaster_id).then(emotes => {
                return { 'Twitch': emotes }
            })
            emotePromises.push(emotePromise)
        } else {
            channelEmotes['Twitch'] = this.cache.ids[broadcaster_id]['Twitch']
        }

        for (const emoteProvider of this.emoteProviders) {
            if (!(emoteProvider.name in this.cache.ids[broadcaster_id]) || emoteProvider.name in forceFetch) {
                let emotePromise = emoteProvider.getEmotes(broadcaster_id).then(emotes => {
                    return { [emoteProvider.name]: emotes }
                })
                emotePromises.push(emotePromise)
            } else {
                channelEmotes[emoteProvider.name] = this.cache.ids[broadcaster_id][emoteProvider.name]
            }
        }

        return Promise.allSettled(emotePromises).then(results => {
            results.forEach(r => {
                if (r.status == 'fulfilled') {
                    Object.assign(this.cache.ids[broadcaster_id], r.value)
                    Object.assign(channelEmotes, r.value)
                } else {
                    console.log(r)
                }
            })

            return channelEmotes
        })
    }

    getEmoteSets(setIDs, forceFetch = {}) {
        let req_setIDs = [], cache_setIDs = []
        setIDs.forEach(id => {
            if (id in forceFetch || !(id in this.cache.sets)) {
                req_setIDs.push(id)
            } else {
                cache_setIDs.push(id)
            }
        })

        console.log(`Requested sets [${setIDs}]\n\tCached: [${cache_setIDs}]\n\tRequesting: [${req_setIDs}]`)

        return new Promise((resolve, reject) => {
            let emoteSets = cache_setIDs.reduce((obj, id) => {
                obj[id] = this.cache.sets[id]
                return obj
            }, {})

            this.twitchWrapper.getEmoteSets(setIDs).then(req_sets => {
                Object.assign(this.cache.sets, req_sets)
                Object.assign(emoteSets, req_sets)

                resolve(emoteSets)
            })
        })
    }

}
