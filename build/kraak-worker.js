(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "worker_threads", "worker_threads"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KraakWorker = void 0;
    const worker_threads_1 = require("worker_threads");
    const worker_threads_2 = require("worker_threads");
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
         * Iedere worker moet een referentie hebben naar de statsworker om te kunnen rapporteren en loggen.
         * @param statsWorker
         */
        koppelStatsWorker(statsWorker = null) {
            if (!statsWorker && this.workerNaam === 'stats') {
                this.statsWorker = this;
            }
            else if (!statsWorker && this.workerNaam !== 'stats') {
                throw new Error('je probeert een niets statsworker te koppelen aan zichtzelf in koppel stats worker');
            }
            else if (statsWorker) {
                this.statsWorker = statsWorker;
            }
        }
        /**
         * als worker message naar master thread stuurt.
         */
        zetOnMessage() {
            this.on('message', (bericht) => {
                var _a, _b, _c, _d, _e;
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
                    if (!(bericht === null || bericht === void 0 ? void 0 : bericht.data.tabel) && !(bericht === null || bericht === void 0 ? void 0 : bericht.data.log)) {
                        worker_threads_2.parentPort === null || worker_threads_2.parentPort === void 0 ? void 0 : worker_threads_2.parentPort.postMessage({
                            type: 'console',
                            data: `${this.workerNaam} statusUpdate object niet goed gevormd.`
                        });
                    }
                    const debugBericht = {
                        type: 'subtaak-delegatie',
                        data: {
                            log: (_b = bericht === null || bericht === void 0 ? void 0 : bericht.data) === null || _b === void 0 ? void 0 : _b.log,
                            naam: ((_c = bericht === null || bericht === void 0 ? void 0 : bericht.data) === null || _c === void 0 ? void 0 : _c.naam) || this.workerNaam || 'onbekend',
                            tabel: (_d = bericht === null || bericht === void 0 ? void 0 : bericht.data) === null || _d === void 0 ? void 0 : _d.tabel
                        }
                    };
                    (_e = this.statsWorker) === null || _e === void 0 ? void 0 : _e.berichtAanWorker(debugBericht);
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
