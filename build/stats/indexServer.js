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
        define(["require", "exports", "http", "fs"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // TODO hele public map publiceren met server.
    const http_1 = __importDefault(require("http"));
    const fs_1 = __importDefault(require("fs"));
    async function default_1() {
        return http_1.default
            .createServer(function (req, res) {
            const indexHTML = fs_1.default.readFileSync(__dirname + '/../../public/index.html'); // TODO van nuts afhalen
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(indexHTML);
            res.end();
        })
            .listen(8080); // TODO uit opties halen
    }
    exports.default = default_1;
});
