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
     * Wrapper voor postMessage áán de worker zodat dit getyped kan worden.
     * Via typing is alle communicatie geregeld. Zie de type defs.
     *
     * Zet in controller context message event handlers zodat workers kunnen consol.loggen en console-lijsten (log zonder [object object] onzin)
     *
     */
    class KraakWorker extends worker_threads_1.Worker {
        constructor(workerLocatie) {
            super(workerLocatie);
            this.workerLocatie = null;
            this.workerNaam = null;
            /**
             * ! primaire scrapers weten zelf hun werk dus bepalen zelf of ze wachtend zijn
             * ! secundaire scrapers horen van hun meester-scraper of ze mogelijk nog werk krijgen.
          
             * betreft allemaal het Worker proces.
             *
             * uit          - ~ is onopgestart
             * gestart      - ~ is opgestart, doet *nog* geen werk.
             * lekker-bezig  - ~ is opgestart, en is met werk bezig.
             * afwachtend   - ~ is opgestart, heeft nu geen werk, of meer komt onduidelijk
             * afgekapt     - ~ is opgelegd gestopt, maar heeft nog werk hebben.
             * mss-afgekapt - ~ is opgelegd gestopt,
             *                   maar had mogelijk meer werk gekregen.
             * verloren     - ~ gestopt door een uncaughtException
             * foute-limbo  - ~ is ogestart, ving fout af, zit nu vast
             * klaar        - ~ is opgestart, heeft nooit meer werk.
             * opgeruimd    - ~ is gestopt, heeft nooit meer werk.
             */
            this.workerThreadStatus = 'uit';
            this.workerArbeidsRelatie = workerLocatie.includes('primair')
                ? 'primair'
                : 'secundair';
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
         * oude log methode... gehouden omdat de logger in
         * de browser kapot kan gaan vanwege redenen
         * deze is handig erbij
         * @deprecated
         */
        console(bericht) {
            var _a;
            console.log(`${bericht.data} ${(_a = this.workerNaam) === null || _a === void 0 ? void 0 : _a.padStart(25)}     `);
        }
        /**
         * als worker message naar master thread stuurt.
         */
        zetOnMessage() {
            this.on('message', (bericht) => {
                var _a;
                if (bericht.type === 'console') {
                    this.console(bericht);
                }
                if (bericht.type === 'stats') {
                    if (!this.statsWorker) {
                        throw new Error(`KOPPEL EERST DE STATWORKER AAN ${this.workerNaam}`);
                        return;
                    }
                    const d = bericht.data;
                    (_a = this.statsWorker) === null || _a === void 0 ? void 0 : _a.berichtAanWorker({
                        type: 'subtaak-delegatie',
                        data: {
                            log: d.log,
                            naam: bericht.workerNaam || this.workerNaam || 'onbekend',
                            tabel: d.tabel
                        }
                    });
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
            console.log(`\n${this.workerNaam}`);
            console.log(bericht);
            this.postMessage(bericht);
            return this;
        }
    }
    exports.KraakWorker = KraakWorker;
});
