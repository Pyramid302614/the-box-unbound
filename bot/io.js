const { WebhookClient } = require("discord.js");

var channel = undefined;
const webhookRaw = require("fs").readFileSync("webhook","utf-8").toString().trim();
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

        (async () => {
            try {
                if(!system && author.startsWith("::::")) return; // Anti-echo
                const message =
                    system?
                    `**${msg}**`:
                    `**${author}** > ${msg}`;
                if(system) await channel?.send?.(message);
                else await webhookClient?.send?.({
                    username: author,
                    avatarURL: "https://github.com/Pyramid302614/the-box-unbound/blob/main/assets/no-pfp.png?raw=true",
                    content: msg
                });
            } catch(ignored) {}
        })();

    }

}