import { Tab } from "./SplitView/Tab.js"
import { Container } from "./SplitView/Container.js"
import { SplitView } from "./SplitView/SplitView.js"
import { Chat } from "./Chat/Chat.js"

let sw = SplitView.new()
document.body.appendChild(sw)

let c = Container.new()
sw.insertContainer(c)

let t1 = Tab.new('tmi', Chat.new('tmi CHAT'))
let t2 = Tab.new('#test', Chat.new('#test CHAT'))

c.appendTab(t1)
c.appendTab(t2)

c = Container.new()
sw.insertContainer(c)

let t3 = Tab.new('#testc3', Chat.new('#testc3 CHAT'))
let t4 = Tab.new('#testc4', Chat.new('#testc4 CHAT'))

c.appendTab(t3)
c.appendTab(t4)
