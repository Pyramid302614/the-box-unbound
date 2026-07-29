const { Events } = require("discord.js");

module.exports = {

    data: Events.ClientReady,
    once: false,
    async execute(client) {

        console.log("Client ready");
        await require("../shared.js").clientReady();
        // require("../io.js").out(null,"# The Box has been opened",true);

    }

}