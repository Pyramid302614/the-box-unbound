const bypassAllWallErrors = false;
var wallError = false;

if("&&test" == "&" + "&test") {

    document.body.style.backgroundColor = "red";
    document.getElementById("splash").innerHTML = "<b style='color:white'>( ! ) Template Error ( ! )";
    wallError = true;

}

if(!wallError || bypassAllWallErrors) {

    document.body.style.backgroundColor = "white";

    // Template storage
    const chatbox = {
        ws: "&&chatbox.ws",
        host: "&&chatbox.host"
    };
    const client = {
        id: "&&client.id",
        name: "Unknown"
    };

    // Nickname
    async function nicknameSetFromTextbox() {
        
        const result = await updateName(document.getElementById("nickname-textbox").value);
        if(result) {
            updateLocalName(document.getElementById("nickname-textbox").value);
            document.getElementById("nickname-textbox").value = "";
        } else document.getElementById("nickname-textbox").style.backgroundColor = "red";

    }
    function updateLocalName(name_) {

        document.getElementById("name-display").innerHTML = name_;
        client.name = name_;
        
    }
    async function fetchName() {

        return await (await fetch(chatbox.host+"/me:"+client.id)).text();
    
    }
    async function updateName(name) {

        if(!ws) {
            systemMessage("Unable to update name: You are not connected to the websocket!");
            return false;
        }
        ws.send("name>"+name);
        return true;

    }


    // Message sending
    function messageFromTextbox() {

        const value = document.getElementById("message-textbox").value;
        if(isCommand(value)) processCommand(value);
        else ws.send("message>"+value);
        document.getElementById("message-textbox").value = "";

    }


    // Websocket
    var ws;
    async function connectToWS() {

        ws = new WebSocket(chatbox.ws);

        await new Promise(resolve => ws.onopen = resolve);

        ws.send("join>"+client.id);

        document.getElementById("loading-text").innerHTML = "Joining...";

        const onmessage = (e) => {

            const signal = e.data;

            switch(signal.split(">")[0]) {

                case "alert": 

                    systemMessage(signal.slice("alert>".length)); break;

                case "join":

                    systemMessage(`${signal.slice("join>".length)} joined.`); break;

                case "leave":

                    systemMessage(`${signal.slice("leave>".length)} left.`); break;

                case "message":

                    var author = signal.split("&&&&&&&&")[1];
                    if(author.startsWith("::::")) author = author.slice("::::".length);
                    userMessage(author,signal.slice("message>".length).split("&&&&&&&&")[0]);
                    if(author == client.name) window.scrollTo(0,document.body.scrollHeight);
                    break;

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

        };

        const onclose = (e) => {
            systemMessage("The websocket has unexpectedly closed.<br/>Attemping to reconnect...");
            var i = setInterval(async () => {
                try {
                    ws = await new WebSocket(chatbox.ws);
                    await new Promise(resolve => ws.onopen = resolve);
                    ws.onmessage = onmessage;
                    ws.onclose = onclose;
                    systemMessage("Re-established communication with WebSocket.");
                    ws.send("join>"+client.id);
                    clearInterval(i);
                } catch(ignored) {}
            },5_000);
        };

        ws.onmessage = onmessage;
        ws.onclose = onclose;

    }

    // Content output handling
    function rawMessage(msg) {
        document.getElementById("messages").innerHTML += `${msg}<br/>`;
    }
    function systemMessage(msg) {
        rawMessage(`<b class='gradient-lr'>${msg}</b>`)
    }
    function userMessage(author,msg) {
        rawMessage(`<b>${author}</b> > ${msg}`);
    }
    function isCommand(msg) {
        return msg.startsWith("/");
    }
    function processCommand(rawMsg) {
        const cmdName = rawMsg.split(" ")[0].slice(1);
        systemMessage("/" + cmdName + " > " + commands[cmdName](rawMsg.split(" ")?.[1]?.split?.(",")??[]));
    }

    const commands = {

        unread: (args) => {
            (async () => {
                const chatLogs = await (await fetch(chatbox.host+"/chat.log")).text();
                const logOff = parseInt("&&logOff");
                console.log(chatLogs.split("\n").length + "," + logOff);               // +1 -> length
                document.getElementById("messages").innerHTML = chatLogs.split("\n").slice(logOff+1).join("<br/>");
            })();
            return "Fetching!";
        }

    };

    // Splash Screen
    (async () => {

        await new Promise(resolve => setTimeout(resolve,2_500));

        document.getElementById("loading-text").innerHTML = "Fetching name...";
        updateLocalName(await fetchName());

        document.getElementById("loading-text").innerHTML = "Connecting to WebSocket...";
        await connectToWS();
        
        document.getElementById("nickname-textbox").addEventListener("keydown",(e) => {
            if(e.key == "Enter") nicknameSetFromTextbox();
            document.getElementById("nickname-textbox").style.backgroundColor = "black";
        });
        window.addEventListener("keydown",(e) => {
            if(document.activeElement != document.getElementById("nickname-textbox")) {
                if(!e.ctrlKey && !e.altKey && !e.metaKey) document.getElementById("message-textbox").focus();
            } else {
                if(e.key == "Enter") messageFromTextbox();
            }
        });

        // Transition to home
            // await new Promise(resolve => setTimeout(resolve,2_000));
        document.getElementById("splash--container").style.opacity = 0;
        await new Promise(resolve => setTimeout(resolve,500));
        document.getElementById("nonsplash--container").style.opacity = 1;
        
        document.getElementById("message-textbox").focus();

    })();

}