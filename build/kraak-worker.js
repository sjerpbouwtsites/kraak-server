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
    exports.KraakWorker = void 0;
    const worker_threads_1 = require("worker_threads");
    /**
     * Leeft in de master thread context.
     * Wrapper voor gedeelde functies van workers zoals console loggen,
     * status opvragen.
     */
    class KraakWorker extends worker_threads_1.Worker {
        constructor(workerLocatie) {
            super(workerLocatie);
            this.workerLocatie = null;
            this.workerNaam = null;
            this.zetNaam(workerLocatie);
            this.zetOnMessage();
            return this;
        }
        /**
         * als worker message naar master thread stuurt.
         */
        zetOnMessage() {
            this.on('message', (bericht) => {
                if (bericht.type === 'console') {
                    console.log(`
        ${this.workerNaam} worker
        ${bericht.data}`);
                }
            });
        }
        zetNaam(workerLocatie) {
            const wl = workerLocatie.split('/');
            this.workerNaam = wl[wl.length - 1].replace('.js', '');
        }
        /**
         * wrapper om type KraakWorkerBericht te verplichten
         * @param bericht KraakWorkerBericht type
         */
        berichtAanWorker(bericht) {
            this.postMessage(bericht);
        }
    }
    exports.KraakWorker = KraakWorker;
});
