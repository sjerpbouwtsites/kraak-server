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
        koppelStatsWorker(statsWorker) {
            this.statsWorker = statsWorker;
        }
        /**
         * als worker message naar master thread stuurt.
         */
        zetOnMessage() {
            this.on('message', (bericht) => {
                var _a, _b, _c;
                if (bericht.type === 'console') {
                    // TODO legacy?
                    console.log(`${bericht.data} ${(_a = this.workerNaam) === null || _a === void 0 ? void 0 : _a.padStart(25)} 
        `);
                }
                if (bericht.type === 'status') {
                    if (!this.statsWorker) {
                        throw new Error(`KOPPEL EERST DE STATWORKER AAN ${this.workerNaam}`);
                        return;
                    }
                    const debugBericht = {
                        type: 'subtaak-delegatie',
                        data: {
                            log: (_b = bericht === null || bericht === void 0 ? void 0 : bericht.data) === null || _b === void 0 ? void 0 : _b.log,
                            naam: this.workerNaam || 'onbekend',
                            tabel: bericht.data.tabel
                        }
                    };
                    (_c = this.statsWorker) === null || _c === void 0 ? void 0 : _c.berichtAanWorker(debugBericht);
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
