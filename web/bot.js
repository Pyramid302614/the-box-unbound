var ws;

module.exports = {

    async init() {
        ws = new WebSocket(require("./config.json").chatbox.websocket);
        await new Promise(resolve => ws.onopen = resolve);
        ws.onmessage = require("./bot.js").signal;
    },
    signal: () => {}, // Override me
    message(asAuthor,msg) {
        ws.send(`message>${msg}::::${asAuthor??"Bot"}`);
    },
    join() {
        ws.send("join>123456789");
    },
    name(name) {
        ws.send("name>"+name);
    }

}