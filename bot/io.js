const { WebhookClient } = require("discord.js");

var channel = undefined;
const webhookRaw = require("fs").readFileSync("webhook","utf-8");
const webhook = {
    id: webhookRaw.split("&&&&&&&&")[0],
    token: webhookRaw.split("&&&&&&&&")[1]
};
var webhookClient = null;

module.exports = {

    async init() {
        channel = await (await require("./shared.js").client.guilds.fetch(require("./config.json").guild)).channels.fetch(require("./config.json").channel);
        webhookClient = new WebhookClient(webhook);
    },

    in(author,msg) {

        require("../backend/backend.js").webSocketSendAll("message>"+msg+"&&&&&&&&::::"+author+"&&&&&&&&"+Date.now());

    },
    
    out(author,msg,system) {
        
        if(!system && author.startsWith("::::")) return; // Anti-echo
        const message =
            system?
            `**${msg}**`:
            `**${author}** > ${msg}`;
        if(system) channel?.send?.(message);
        else webhookClient?.send?.({
            username: author,
            avatarURL: require("../web/config.json").chatbox.server+"/assets:no-pfp.png",
            content: msg
        });

    }

}