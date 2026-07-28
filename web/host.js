process.addListener("uncaughtException",(e) => console.error(e.message));
process.addListener("unhandledRejection",(r) => console.error(r.reason));

const server = require("http").createServer((req,res) => {
    switch(req.url) {
        case "/":
            res.writeHead(200,{"Content-Type":"text/html"});
            res.end(require("fs").readFileSync("web/client/index.html","utf-8"));
            break;
        case "/styles.css":
            res.writeHead(200,{"Content-Type":"text/css"});
            res.end(require("fs").readFileSync("web/client/styles.css","utf-8"));
            break;
        case "/script.js":
            res.writeHead(200,{"Content-Type":"text/html"});
            res.end(require("fs").readFileSync("web/client/script.js","utf-8"));
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
        console.log("Web client provider open at port " + require("./config.json").hosting.port);
    }
);