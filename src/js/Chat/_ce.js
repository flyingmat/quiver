import { Chat } from "./Chat.js"
import { Message } from "./Message.js"

let elements = [Chat, Message]
elements.forEach(_class => customElements.define(_class.elementTag, _class))
