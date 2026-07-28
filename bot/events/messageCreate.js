const { Events } = require("discord.js");

module.exports = {

    data: Events.MessageCreate,
    once: false,
    async execute(message) {

        if(message.channel.id == require("../config.json").channel && !message.author.bot) require("../io.js").in(message.author,message.content);        

    }

}