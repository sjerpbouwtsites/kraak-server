(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "worker_threads"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const worker_threads_1 = require("worker_threads");
    /**
     * Dit bestand ontvangt vanaf de controller de dagen waarop is gescraped
     * en verwerkt die één voor één. Hieruit worden de adressen gehaald.
     */
    worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.on('message', (bericht) => {
        if (bericht.type === 'start') {
            //
        }
        if (bericht.type === 'stop') {
            process.exit();
        }
        if (bericht.type === 'subtaak-delegatie') {
            verwerkFaillissementScrape(bericht.data);
        }
    });
    function startFailLezer() {
        console.log('start fail lezer');
    }
    /**
     * Krijgt via postMessage inhoud van scrape binnen
     * Verwerkt tot adressen.
     */
    function verwerkFaillissementScrape(failScrapeData) {
        // TODO beter typen
        worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage({
            type: 'console',
            data: 'kreeg data binnen!'
        });
    }
});
