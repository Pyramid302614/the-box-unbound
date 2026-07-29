const { Client, IntentsBitField } = require("discord.js");
const fs = require("fs");

process.addListener("uncaughtException",e => console.error(e));
process.addListener("unhandledRejection",r => console.error(r))

const client = new Client({

    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.MessageContent,
    ]

});

for(const file of fs.readdirSync("bot/events")) {

    const event = require("./events/"+file);
    if(event.once) client.once(event.data,event.execute);
    else client.on(event.data,event.execute);

}

require("./shared.js").client = client;

console.log("Starting discord bot...");
client.login(require("fs").readFileSync("token","utf-8"));

require("./shared.js").clientReady = async () => {

    console.log("Initializing IO...")
    await require("./io.js").init();
    console.log("Ready when you are");

};