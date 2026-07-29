const ws = require("ws");
var wss;

var ipDats = {

};

module.exports = {

    init: init,
    serverRequest: serverRequest,
    webSocketSendAll: webSocketSendAll,
    getClient: getClient,
    getClientIdFromIP: getClientIdFromIP

};

const frameLimit = 10;
const frameDuration = 12_000;

function init(server) {

    setInterval(() => {
        ipDats = {};
    }, frameDuration);
    wss = new ws.Server({ server });
    wss.on("connection",webSocketConnection);
    setInterval(processAllWriteRequests,1_000);
    console.log("Backend ready at url /me");

}

function getIP(req) {
    return req.headers["cf-connecting-ip"] ?? req.socket.remoteAddress;
}

// Returns true/false for ignored/process
function processRateLimiting(req,ws) {

    if(ipDats[getIP(req)] > frameLimit) return true;
    if(ipDats[getIP(req)] == frameLimit) {
        
        if(ws !== undefined) ws.send("mute");
        webSocketSendAll("warning>"+((getClient(getClientIdFromIP(getIP(req)))??{}).displayName ?? "Anonymous ") + " has been temporarily muted for spam.");
        ipDats[getIP(req)]++;
        return true;

    }
    if(!ipDats[getIP(req)] || ipDats[getIP(req)] <= frameLimit+10) ipDats[getIP(req)] = (ipDats[getIP(req)] ?? 0) + 1;
    return false;

}

function serverRequest(req,res) {

    if(processRateLimiting(req)) return;

    res.setHeader('Access-Control-Allow-Origin', "*");
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if(req.method == "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    if(req.url.startsWith("/me:")) {
        const clientId = req.url.split(":")[1];
        res.writeHead(200,{"Content-Type":"text/plain"});
        res.end((getClient(clientId) ?? {}).displayName ?? "Anonymous");
    }

}

function webSocketConnection(ws,req) {

    if(processRateLimiting(req,ws)) return;

    if(getClientIdFromIP(getIP(req))) connectClient(getIP(req));

    const chatLog = (require("fs").readFileSync("backend/chat.log") ?? "").toString();
    const client = getClient(getClientIdFromIP(getIP(req)));    // +1 for join message for reloads
    if(chatLog.split("\n").length-1 > client?.logOffIndex+1) ws.send("alert>🔔 You have unread messages! Run /unread to see what you missed while you were away.");
    ws.on("close",() => webSocketClose(ws,req));

    ws.on("message", event => {

        if(processRateLimiting(req,ws)) return;
    
        const message = event.toString();

        if(message == "heartbeat") return;

        const clientId = getClientIdFromIP(getIP(req));
        const client = getClient(clientId) ?? {};

        switch(message.split(">")[0]) {

            case "join": 
                updateClientIP(message.split(">")[1],getIP(req));
                // connectClient(getIP(req));                        
                break;

            case "message":

                const author = (client.displayName ?? "Anonymous");
                const content = message.slice("message>".length);
                webSocketSendAll("message>"+content+"&&&&&&&&"+author+"&&&&&&&&"+Date.now());
                break;

            case "name":

                const newName = message.slice("name>".length);
                if(clientId != "123456789") webSocketSendAll(`name>${client.displayName??"Anonymous"}&&&&&&&&${newName}`)
                client.displayName = newName;
                updateClient(clientId,client);
                break;

        } 

    });

}
function webSocketClose(ws,req) {

    const clientId = getClientIdFromIP(getIP(req));
    const client = getClient(clientId) ?? {};
    client.connected = false;
    client.logOffIndex = (require("fs").readFileSync("backend/chat.log") ?? "").toString().split("\n").length; // Will land right on your leave message
    updateClient(clientId,client);
    webSocketSendAll(`leave>${client.displayName ?? "Anonymous"}`);

}

function webSocketSendAll(message) {

    require("fs").writeFileSync("backend/chat.log",(require("fs").readFileSync("backend/chat.log") ?? "")+"\n"+parseSignal(message));
    require("../bot/boxbot.js").processSignal(message);
    wss.clients.forEach(client => client.send(message));

}
function parseSignal(signal) {

    switch(signal.split(">")[0]) {

        case "join":

            return `${signal.slice("join>".length)} joined.`;

        case "leave":

            return `${signal.slice("leave>".length)} left.`;

        case "message":

            return `${signal.split("&&&&&&&&")[1]} >> ${(signal.slice("message>".length)).split("&&&&&&&&")[0]}`;

        case "name":

            return `${signal.slice("name>".length).split("&&&&&&&&")[0]} has changed their name to ${signal.split("&&&&&&&&")[1]}`;

        default:

            return `[RAW] ${signal}`;


    }

}


function getClient(clientId) {

    return JSON.parse(require("fs").readFileSync("backend/clients.json"),"utf-8")[clientId];

}
function getClientIdFromIP(ip) {

    for(const clientId of Object.keys(JSON.parse(require("fs").readFileSync("backend/clients.json"),"utf-8")))
        if((getClient(clientId)??{}).ip == ip) return clientId;
    return undefined;

}
function updateClient(clientId,newClient) {
    write("backend/clients.json",clientId,newClient);

}
function updateClientIP(clientId,ip) {

    const client = getClient(clientId) ?? {};
    client.ip = ip;
    updateClient(clientId,client);

}
function connectClient(ip) {

    const clientId = getClientIdFromIP(ip);
    const client = getClient(clientId) ?? {};

    if(!client.connected) webSocketSendAll(`join>${client.displayName ?? "Anonymous"}`);

    client.connected = true;
    updateClient(clientId,client);

}


var writeRequests = [];

async function write(file,property,value) {
    await new Promise(resolve =>
        writeRequests.push({
            file: file,
            property: property,
            value: value,
            onwrite: resolve
        })
    );
}

function modifyObject(obj,path,value) {

    // Stole from snake bot (my own project, so its not theft)
    var temp = structuredClone(obj);
    var dissected = [];
    var split = path.split(".");
    for(let i = 0; i < split.length; i++) {
        dissected.push(temp ?? {});
        if(i != split.length-1 && typeof temp?.[split[i]] != "object") temp[split[i]] = {};
        temp = temp[split[i]];
    }
    dissected.push(value);
    for(let i = split.length-1; i >= 0; i--)
        dissected[i][split[i]] = dissected[i+1];

    return dissected[0];

}

function processAllWriteRequests() {

    const datas = {};
    
    for(const request of writeRequests) {

        if(!Object.keys(datas).includes(request.file)) {
            datas[request.file] = JSON.parse(require("fs").readFileSync(request.file),"utf-8");
        }

    }

    for(const request of writeRequests) { // Newest gets written last

        if(request.property) {
            try {
                datas[request.file] = modifyObject(datas[request.file],request.property,request.value);
            } catch(ignored) {}
        }

    }

    for(const file of Object.keys(datas)) {

        require("fs").writeFileSync(file,JSON.stringify(datas[file],null,2),"utf-8");

    }

    for(const request of writeRequests) {

        request.onwrite?.();

    }

    writeRequests = [];

}