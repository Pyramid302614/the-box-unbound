process.addListener("uncaughtException",(e) => console.error(e));
process.addListener("unhandledRejection",(r) => console.error(r));

function ambervars(str,values) {
    for(ambervar of Object.keys(values)) str = str.replaceAll(`&&${ambervar}`,values[ambervar]);
    return str;
}

function ip(req) {
    return req.socket.remoteAddress;
}
function randomClientId() {
    const existing = Object.values(JSON.parse(require("fs").readFileSync("web/clients.json","utf-8")));
    var tried = null;
    while(tried === null || existing.includes(tried)) {
        tried = Math.floor(Math.random()*10_000);
    }
    return tried;
}
function clientId(ip) {
    const data = JSON.parse(require("fs").readFileSync("web/clients.json","utf-8"));
    if(!Object.keys(data).includes(ip)) {
        data[ip] = randomClientId();
        require("fs").writeFileSync("web/clients.json",JSON.stringify(data,null,2),"utf-8");
        return data[ip];
    } else {
        return data[ip];
    }
}
async function wait(ms) {
    await new Promise(resolve => setTimeout(resolve,ms));
}

const server = require("http").createServer(async (req,res) => {
console.log(req.url);
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', "*");
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if(req.method == "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }


    const universalAmbervars = {
        "test": true,
        "chatbox.ws": require("./config.json").chatbox.websocket,
        "chatbox.host": require("./config.json").chatbox.server,
        "client.id": null
    }
    const getClientId = () => {
        universalAmbervars["client.id"] = clientId(ip(req));
    };
    
    switch(req.url.split(":")[0]) {
        case "/assets":
            const path = req.url.slice(1).replaceAll(":","/");
            if(!require("fs").existsSync(path)) {
                res.writeHead(404,{"Content-Type":"text/plain"});
                res.end("404! Cannot find resource :(");
                break;
            }
            var contentType = "text/plain";
            switch(contentType.split(".")[1]) {
                case "png": contentType = "image/png"
                case "ttf": contentType = "font/ttf"
            }
            res.writeHead(200,{"Content-Type":contentType});
            res.end(require("fs").readFileSync(path));
            break;
        case "/me":
            require("../backend/backend.js").serverRequest(req,res);
            break;
        case "/":
            getClientId();
            res.writeHead(200,{"Content-Type":"text/html"});
            res.end(
                ambervars(
                    require("fs").readFileSync("web/client/index.html","utf-8"),
                    universalAmbervars
                )
            );
            break;
        case "/styles.css":
            await wait(1000);
            getClientId();
            res.writeHead(200,{"Content-Type":"text/css"});
            res.end(
                ambervars(
                    require("fs").readFileSync("web/client/styles.css","utf-8"),
                    universalAmbervars
                )
            );
            break;
        case "/script.js":
            await wait(1000);
            getClientId();
            res.writeHead(200,{"Content-Type":"application/json"});
            res.end(
                ambervars(
                    require("fs").readFileSync("web/client/script.js","utf-8"),
                    universalAmbervars
                )
            );
            break;
        default:
            res.writeHead(200,{"Content-Type":"text/plain"});
            res.end("Unknown URL");
            break;
    }
}).listen(
    require("./config.json").hosting.port,
    "0.0.0.0",
    () => {
        console.log("Web client provider + Unbound backend open at port " + require("./config.json").hosting.port);
    }
);

require("../backend/backend.js").init(server);