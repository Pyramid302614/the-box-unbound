// const antiEcho = {}

var channel = null;

module.exports = {

    async init() {
        channel = await (await require("./shared.js").client.guilds.fetch(require("./config.json").guild)).channels.fetch(require("./config.json").channel);
    },

    in(author,msg) {

        require("../web/bot.js").message(author,msg);

    },
    
    out(author,msg,system) {

        const message =
            system?
            `**${msg}**`:
            `**${author}** > ${msg}`;

        channel.send(message);

    }

}