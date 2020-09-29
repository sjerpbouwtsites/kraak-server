/**
 * @file maakt de http server aan voor index.html, waar de statworker zijn resultaat naar schrijft. Wordt geopend in browser.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "http", "fs", "worker_threads", "../config"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // TODO hele public map publiceren met server.
    const http_1 = __importDefault(require("http"));
    const fs_1 = __importDefault(require("fs"));
    const worker_threads_1 = require("worker_threads");
    const config_1 = __importDefault(require("../config"));
    async function default_1() {
        try {
            return http_1.default
                .createServer(function (req, res) {
                worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage({
                    type: 'console',
                    data: 'maak server jo!'
                });
                const indexHTML = fs_1.default.readFileSync(`${config_1.default.pad.public}/index.html`);
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.write(indexHTML);
                res.end();
            })
                .listen(config_1.default.server.publicPort);
        }
        catch (e) {
            return new Error(e);
        }
    }
    exports.default = default_1;
});
