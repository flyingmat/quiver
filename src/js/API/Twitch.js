export class Twitch {

    static URL_API = 'https://api.twitch.tv/helix'

    static URL_GET_USERS = Twitch.URL_API + '/users'

    static URL_GET_GLOBAL_EMOTES = Twitch.URL_API + '/chat/emotes/global'
    static URL_GET_CHANNEL_EMOTES = Twitch.URL_API + '/chat/emotes'
    static URL_GET_EMOTE_SET = Twitch.URL_API + '/chat/emotes/set'

    static URL_GET_GLOBAL_BADGES = Twitch.URL_API + '/chat/badges/global'
    static URL_GET_CHANNEL_BADGES = Twitch.URL_API + '/chat/badges'

    constructor(id, token) {
        this.id = id
        this.token = token

        this.authHeaders = {
            'Authorization': `Bearer ${token}`,
            'Client-Id': id
        }

        this.emoteProvider = TwitchEmoteProvider
    }

    get(endpoint) {
        return fetch(endpoint, {'headers': this.authHeaders})
    }

    getUsers({id = [], login = []} = {}) {
        return this.get(`${Twitch.URL_GET_USERS}?${[...id.map(id => 'id='.concat(id)), ...login.map(l => 'login='.concat(l))].join('&')}`)
    }

    getGlobalEmotes() {
        return this.get(Twitch.URL_GET_GLOBAL_EMOTES)
    }

    getChannelEmotes(broadcaster_id) {
        return this.get(`${Twitch.URL_GET_CHANNEL_EMOTES}?broadcaster_id=${broadcaster_id}`)
    }

    getEmoteSets(emote_set_id) {
        return this.get(`${Twitch.URL_GET_EMOTE_SET}?${emote_set_id.map(id => 'emote_set_id='.concat(id)).join('&')}`)
    }

    getGlobalBadges() {
        return this.get(Twitch.URL_GET_GLOBAL_BADGES)
    }

    getChannelBadges(broadcaster_id) {
        return this.get(`${Twitch.URL_GET_CHANNEL_BADGES}?broadcaster_id=${broadcaster_id}`)
    }

}

class TwitchEmoteProvider {

    static formatEmotes(emoteData) {
        return emoteData.data.reduce((obj, e) => {
            obj[e.name] = emoteData.template
                .replace('{{id}}', e.id)
                .replace('{{format}}', 'default')
                .replace('{{theme_mode}}', e.theme_mode.includes('dark') ? 'dark' : 'light')
                .replace('{{scale}}', '1.0')
            return obj
        }, {})
    }

    constructor(twitchAPI) {
        this.twitchAPI = twitchAPI
        this.template = null
        this.twitchAPI.getGlobalEmotes().then(r => r.json()).then(j => this.template = j.template)
    }

    getEmotes(broadcaster_id) {
        if (broadcaster_id === undefined) {
            return this.twitchAPI.getGlobalEmotes().then(r => r.json()).then(j => TwitchEmoteProvider.formatEmotes(j))
        } else {
            return this.twitchAPI.getChannelEmotes(broadcaster_id).then(r => r.json()).then(j => TwitchEmoteProvider.formatEmotes(j))
        }
    }

    buildEmoteURL(id) {
        return this.template.replace('{{id}}', id).replace('{{format}}', 'default').replace('{{theme_mode}}', 'dark').replace('{{scale}}', '1.0')
    }

    get name() {
        return 'Twitch'
    }

}

export class TwitchWrapper {

    static EMOTE_TEMPLATE = 'https://static-cdn.jtvnw.net/emoticons/v2/{{id}}/{{format}}/{{theme_mode}}/{{scale}}'
    
    constructor(twitchAPI) {
        this.twitchAPI = twitchAPI
    }

    static _buildEmoteURL(id, opts = {}) {
        return TwitchWrapper.EMOTE_TEMPLATE
            .replace('{{id}}', id)
            .replace('{{format}}', opts.format ?? 'default')
            .replace('{{theme_mode}}', opts.theme ?? 'dark')
            .replace('{{scale}}', opts.scale ?? '1.0')
    }

    static buildEmoteURLs(id, opts = {}) {
        opts.scale = ''
        let url_base = TwitchWrapper._buildEmoteURL(id, opts)

        let url_1x = url_base.concat('1.0')

        return {
            'src': url_1x,
            'srcset': `${url_1x} 1x, ${url_base.concat('2.0')} 2x, ${url_base.concat('3.0')} 4x`
        }
    }

    getGlobalEmotes() {
        console.log('tglobal')
        return this.twitchAPI.getGlobalEmotes().then(r => r.json()).then(j => j.data.reduce((obj, e) => {
            e['_QVR_PROVIDER'] = 'Twitch'
            e['_QVR_URLDATA'] = TwitchWrapper.buildEmoteURLs(e.id)
            obj[e.name] = e
            return obj
        }, {}))
    }

    getChannelEmotes(broadcaster_id) {
        console.log('tchann')
        return this.twitchAPI.getChannelEmotes(broadcaster_id).then(r => r.json()).then(j => j.data.reduce((obj, e) => {
            if (!(e.tier in obj)) {
                obj[e.tier] = {}
            }
            e['_QVR_PROVIDER'] = 'Twitch'
            e['_QVR_URLDATA'] = TwitchWrapper.buildEmoteURLs(e.id)
            obj[e.tier][e.name] = e
            return obj
        }, {}))
    }

    getEmotes(broadcaster_id) {
        if ((broadcaster_id ?? '0') === '0') {
            return this.getGlobalEmotes()
        } else {
            return this.getChannelEmotes(broadcaster_id)
        }
    }

    /*

    {
        set_id: {
            emoteName: emoteData,
            ...
        },
        ...
    }

    */
    getEmoteSets(setIDs) {
        return new Promise((resolve, reject) => {
            let promiseList = [], t_setIDs = setIDs
            do {
                promiseList.push(this.twitchAPI.getEmoteSets(t_setIDs.slice(0, 25)).then(r => r.json()))
                t_setIDs = t_setIDs.slice(25)
            } while (t_setIDs.length > 25)

            Promise.allSettled(promiseList).then(results => {
                let emoteSets = results.reduce((obj, r) => {
                    if (r.status == 'fulfilled') {
                        r.value.data.forEach(emote => {
                            let id = emote['emote_set_id']
                            if (!(id in obj)) {
                                obj[id] = {
                                    'owner_id': null,
                                    'owner': null,
                                    'emotes': {}
                                }
                            }

                            if (obj[id]['owner_id'] === null) {
                                obj[id]['owner_id'] = emote['owner_id']
                            }

                            emote['_QVR_PROVIDER'] = 'Twitch'
                            emote['_QVR_URLDATA'] = TwitchWrapper.buildEmoteURLs(emote.id)

                            obj[id].emotes[emote.name] = emote
                        })
                    } else {
                        console.log(r)
                    }
                    return obj
                }, {})

                let ownerIDs = []

                setIDs.forEach(id => {
                    if (!(id in emoteSets)) {
                        emoteSets[id] = {}
                    } else if (id !== '0') {
                        ownerIDs.push(emoteSets[id]['owner_id'])
                    }
                })

                // check limit 100 query params in get users !

                this.twitchAPI.getUsers({id: ownerIDs}).then(r => r.json()).then(owners => {
                    owners = owners.data.reduce((obj, o) => {
                        obj[o.id] = o
                        return obj
                    }, {})

                    for (const setID in emoteSets) {
                        if (emoteSets[setID]['owner_id'] !== '0') {
                            emoteSets[setID].owner = owners[emoteSets[setID]['owner_id']]
                        }
                    }

                    resolve(emoteSets)
                })
            })
        })
    }

}
