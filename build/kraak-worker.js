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
    exports.workerOpExit = exports.KraakWorker = void 0;
    const worker_threads_1 = require("worker_threads");
    /**
     * Leeft in de master thread context.
     */
    class KraakWorker extends worker_threads_1.Worker {
        constructor(workerLocatie) {
            super(workerLocatie);
            this.workerLocatie = null;
            this.workerNaam = null;
            this.zetNaam(workerLocatie);
            this.zetOnMessage();
        }
        /**
         * als worker message naar master thread stuurt.
         */
        zetOnMessage() {
            this.on('message', (bericht) => {
                if (bericht.type === 'console') {
                    console.log(`
        ${this.workerNaam} worker
        ${bericht.data}
        `);
                }
                else {
                    throw new Error('onduidelijk bericht');
                }
            });
        }
        zetNaam(workerLocatie) {
            const wl = workerLocatie.split('/');
            this.workerNaam = wl[wl.length - 1].replace('.js', '');
        }
    }
    exports.KraakWorker = KraakWorker;
    function workerOpExit(self) {
        self.on('exit', () => {
            worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage({
                workerNaam: 'FIX ME LATER',
                type: 'console',
                data: `worker op ??? gestopt`
            });
        });
    }
    exports.workerOpExit = workerOpExit;
});
