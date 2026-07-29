const { Events } = require("discord.js");

module.exports = {

    data: Events.MessageCreate,
    once: false,
    async execute(message) {

        if(message.author.bot) return;

        const member = await (await require("../shared.js").client.guilds.fetch(require("../config.json").guild)).members.fetch(message.author.id);
        if(message.channel.id == require("../config.json").channel) require("../io.js").in(member.displayName,message.content);        

    }

}