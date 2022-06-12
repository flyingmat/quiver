export class Twitch {

    static URL_GET_USERS = 'https://api.twitch.tv/helix/users'

    constructor(id, token) {
        this.id = id
        this.token = token

        this.authHeaders = {
            'Authorization': `Bearer ${token}`,
            'Client-Id': id
        }
    }

    get(endpoint) {
        return fetch(endpoint, {'headers': this.authHeaders})
    }

    getUsers(params = {'id': [], 'login': []}) {
        return this.get(`${Twitch.URL_GET_USERS}?${new URLSearchParams(params)}`)
    }

}
