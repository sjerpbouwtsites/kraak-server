var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "worker_threads", "http", "fs"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const worker_threads_1 = require("worker_threads");
    const http_1 = __importDefault(require("http"));
    const fs_1 = __importDefault(require("fs"));
    const io = require('socket.io')(http_1.default);
    worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.on('message', (bericht) => {
        if (bericht.type === 'start') {
            initServer();
            const wss = initWebsocket();
            worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage({
                type: 'ws-init',
                data: 'ja'
            });
        }
        if (bericht.type === 'stop') {
            process.exit();
        }
    });
    function initServer() {
        //create a server object:
        http_1.default
            .createServer(function (req, res) {
            const indexHTML = fs_1.default.readFileSync(__dirname + '/../../public/index.html');
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(indexHTML); //write a response to the client
            res.end(); //end the response
        })
            .listen(8080); //the server object listens on port 8080
    }
    function initWebsocket() {
        io.on('connection', (socket) => {
            worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage({
                type: 'console',
                data: 'verbinding vanuit user'
            });
        });
    }
});
