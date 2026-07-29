module.exports = {

    processSignal(signal) {

        switch(signal.split(">")[0]) {

            case "join":

                systemMessage(`${signal.slice("join>".length)} joined.`); break;

            case "leave":

                systemMessage(`${signal.slice("leave>".length)} left.`); break;

            case "message":

                userMessage(signal.split("&&&&&&&&")[1],signal.slice("message>".length).split("&&&&&&&&")[0]); break;

            case "name":

                systemMessage(`${signal.slice("name>".length).split("&&&&&&&&")[0]} has changed their name to ${signal.split("&&&&&&&&")[1]}`); break;

            case "warning":

                systemMessage(signal.slice("warning>".length)); break;

            case "mute":

                document.getElementById("message-textbox").disabled = true;
                setTimeout(() => {
                    document.getElementById("message-textbox").disabled = false;
                },3000);
                break;

            default:

                systemMessage(`[RAW] ${signal}`); break;


        }
        
    }

}

function systemMessage(msg) {
    require("./io.js").out(null,msg,true);
}
function userMessage(author,msg) {
    require("./io.js").out(author,msg,false);
}