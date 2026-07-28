const { Events } = require("discord.js");

module.exports = {

    data: Events.ClientReady,
    once: false,
    async execute(client) {

        console.log("Client ready");
        require("../shared.js").clientReady();

    }

}