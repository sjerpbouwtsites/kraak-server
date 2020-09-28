var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "worker_threads", "./nuts/generiek"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KraakWorker = void 0;
    const worker_threads_1 = require("worker_threads");
    const generiek_1 = __importDefault(require("./nuts/generiek"));
    /**
     * Leeft in de master thread context.
     * Is een REFERENTIE aan de worker, niet de worker zelf.
     * Initieerd de Worker. Geeft de worker naam.
     * Wrapper voor postMessage áán de worker zodat dit getyped kan worden
     * Zet in controller context message event handlers zodat workers kunnen consol.loggen en console-lijsten (log zonder [object object] onzin)
     *
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
                var _a;
                if (bericht.type === 'console-lijst') {
                    console.log(`
        ${this.workerNaam} worker
        ${generiek_1.default.objectNaarTekst(bericht.data)}`);
                }
                if (bericht.type === 'console') {
                    console.log(`${bericht.data} ${(_a = this.workerNaam) === null || _a === void 0 ? void 0 : _a.padStart(25)} 
        `);
                }
            });
            return this;
        }
        zetNaam(workerLocatie) {
            const wl = workerLocatie.split('/');
            this.workerNaam = wl[wl.length - 1].replace('.js', '');
            return this;
        }
        /**
         * wrapper om type KraakWorkerBericht te verplichten
         * @param bericht KraakWorkerBericht type
         */
        berichtAanWorker(bericht) {
            this.postMessage(bericht);
            return this;
        }
    }
    exports.KraakWorker = KraakWorker;
});
