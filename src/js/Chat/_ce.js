import { Chat } from "./Chat.js"

let elements = [Chat]
elements.forEach(_class => customElements.define(_class.elementTag, _class))
