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

    // Server
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

    // Websocket
    var ws;
    async function connectToWS() {

        ws = new WebSocket("ws://localhost:3000");

        await new Promise(resolve => ws.onopen = resolve);

        ws.send("join>"+client.id);

        document.getElementById("loading-text").innerHTML = "Joining...";

        await new Promise(resolve => setTimeout(resolve,1_000)); // Give it time to process

        const onmessage = (e) => {
            console.log(e);
        };

        const onclose = (e) => {
            systemMessage("The websocket has unexpectedly closed.<br/>Attemping to reconnect...");
            var i = setInterval(async () => {
                try {
                    ws = new WebSocket(chatbox.ws);
                    await new Promise(resolve => ws.opopen = resolve);
                    ws.onmessage = onmessage;
                    ws.onclose = onclose;
                    systemMessage("Re-established communication with WebSocket.");
                    clearInterval(i);
                } catch(ignored) {}
            },5_000);
        };

        ws.onmessage = onmessage;
        ws.onclose = onclose;

    }

    // Content output handling
    function rawMessage(msg) {
        document.getElementById("content").innerHTML += `${msg}<br/>`;
    }
    function systemMessage(msg) {
        rawMessage(`<b class='gradient-lr'>${msg}</b>`)
    }
    function userMessage(author,msg) {
        rawMessage(`<b>${author}</b> > ${msg}`);
    }

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

        // Transition to home
        await new Promise(resolve => setTimeout(resolve,2_000));
        document.getElementById("splash--container").style.opacity = 0;
        await new Promise(resolve => setTimeout(resolve,500));
        document.getElementById("nonsplash--container").style.opacity = 1;

    })();

}