const REGEX_PRIVMSG = new RegExp("@(?<tags>.+?) :(?<user>.+?)!.+? PRIVMSG #(?<channel>.+?) :(?<message>.+)");
const REGEX_JOIN = new RegExp(":(?<user>.+?)!.+? JOIN #(?<channel>.+)");
const REGEX_NAMES_BEGIN = new RegExp(":.+? = #(?<channel>.+?) :.+");
const REGEX_NAMES_END = new RegExp(":.+? #(?<channel>.+?) :End of /NAMES list");
const REGEX_GLOBALUSERSTATE = new RegExp("@(?<tags>.+?) :tmi\.twitch\.tv GLOBALUSERSTATE")
const REGEX_USERSTATE = new RegExp("@(?<tags>.+?) :tmi\.twitch\.tv USERSTATE #(?<channel>.+)")
const REGEX_ROOMSTATE = new RegExp("@(?<tags>.+?) :tmi\.twitch\.tv ROOMSTATE #(?<channel>.+)")
const REGEX_CLEARCHAT = new RegExp("@(?<tags>.+?) :tmi\.twitch\.tv CLEARCHAT #(?<channel>.+?) :(?<user>.+)")


function parseTags(tags) {
    return tags.split(';').reduce((obj, tag) => {
        let tagSplit = tag.split('=')
        obj[tagSplit[0]] = tagSplit[1]
        return obj
    }, {})
}

export function parseMessage(message) {
    let m = null
    if ((m = message.match(REGEX_PRIVMSG)) != null) {
        return {
            'type': 'PRIVMSG',
            'channel': `#${m.groups.channel}`,
            'user': m.groups.user,
            'content': m.groups.message,
            'tags': parseTags(m.groups.tags)
        }
    } else if ((m = message.match(REGEX_JOIN)) != null) {
        return {
            'type': 'JOIN',
            'channel': `#${m.groups.channel}`,
            'user': m.groups.user,
            'content': message
        }
    } else if ((m = message.match(REGEX_NAMES_BEGIN)) != null) {
        return {
            'type': 'NAMES_BEGIN',
            'channel': `#${m.groups.channel}`,
            'content': message
        }
    } else if ((m = message.match(REGEX_NAMES_END)) != null) {
        return {
            'type': 'NAMES_END',
            'channel': `#${m.groups.channel}`,
            'content': message
        }
    } else if ((m = message.match(REGEX_ROOMSTATE)) != null) {
        return {
            'type': 'ROOMSTATE',
            'channel': `#${m.groups.channel}`,
            'content': message,
            'tags': parseTags(m.groups.tags)
        }
    } else if ((m = message.match(REGEX_USERSTATE)) != null) {
        return {
            'type': 'USERSTATE',
            'channel': `#${m.groups.channel}`,
            'content': message,
            'tags': parseTags(m.groups.tags)
        }
    } else if ((m = message.match(REGEX_CLEARCHAT)) != null) {
        return {
            'type': 'CLEARCHAT',
            'channel': `#${m.groups.channel}`,
            'user': m.groups.user,
            'content': message,
            'tags': parseTags(m.groups.tags)
        }
    } else if ((m = message.match(REGEX_GLOBALUSERSTATE)) != null) {
        return {
            'type': 'GLOBALUSERSTATE',
            'channel': 'tmi',
            'content': message,
            'tags': parseTags(m.groups.tags)
        }
    } else {
        return {
            'type': 'UNKNOWN',
            'channel': 'tmi',
            'content': message
        }
    }
}
