const REGEX_PRIVMSG = new RegExp("@(?<tags>.+?) :(?<user>.+?)!.+? PRIVMSG #(?<channel>.+?) :(?<message>.+)");
const REGEX_JOIN = new RegExp(":(?<user>.+?)!.+? JOIN #(?<channel>.+)");
const REGEX_NAMES_BEGIN = new RegExp(":.+? = #(?<channel>.+?) :.+");
const REGEX_NAMES_END = new RegExp(":.+? #(?<channel>.+?) :End of /NAMES list");

export function parseMessage(message) {
    let m = null
    if ((m = message.match(REGEX_PRIVMSG)) != null) {
        return {
            'type': 'PRIVMSG',
            'channel': `#${m.groups.channel}`,
            'user': m.groups.user,
            'content': m.groups.message,
            'tags': m.groups.tags.split(';').reduce((obj, tag) => {
                let tagSplit = tag.split('=')
                obj[tagSplit[0]] = tagSplit[1]
                return obj
            }, {})
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
    } else {
        return {
            'type': 'UNKNOWN',
            'channel': 'tmi',
            'content': message
        }
    }
}
