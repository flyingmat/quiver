import { Chat, ChatBox, EmotePane, SuggestionPane, Suggestion } from "./Chat.js"
import { Message } from "./Message.js"
import { Emote } from "./Emote.js"

let elements = [Chat, SuggestionPane, Suggestion, EmotePane, ChatBox, Message, Emote]
elements.forEach(_class => customElements.define(_class.elementTag, _class))
