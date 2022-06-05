import { Tab } from "./Tab.js"
import { ChatBar } from "./ChatBar.js"
import { Container } from "./Container.js"
import { Resizer } from "./Resizer.js"
import { SplitView } from "./SplitView.js"

let elements = [Tab, ChatBar, Container, Resizer, SplitView]
elements.forEach(_class => customElements.define(_class.elementTag, _class))
