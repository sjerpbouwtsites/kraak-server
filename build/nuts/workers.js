/**
 * gemene nutsfuncties van de varia workers.
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
        define(["require", "exports", "worker_threads", "../kraak-worker", "fs"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const worker_threads_1 = require("worker_threads");
    const kraak_worker_1 = require("../kraak-worker");
    const fs_1 = __importDefault(require("fs"));
    exports.default = {
        /**
         * naam wordt toegevoegd door kraak-worker, waar het quasi-doorheen gaat.
         * @param logbericht string
         */
        log(logbericht) {
            const ppMessage = {
                type: 'stats',
                data: {
                    log: logbericht
                }
            };
            worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage(ppMessage);
        },
        /**
         *
         * naam wordt toegevoegd door kraak-worker, waar het quasi-doorheen gaat.
         * @param data kan ieder object zijn.
         */
        tabel(teTabelleren) {
            const ppMessage = {
                type: 'stats',
                data: {
                    tabel: teTabelleren
                }
            };
            worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage(ppMessage);
        },
        /**
         * Kort voor de parentPort methode.
         * @param data
         */
        subtaakDelegatie(data) {
            worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage({
                type: 'subtaak-delegatie',
                data: data
            });
        },
        /**
         * bericht type commando mag slechts start, stop en opruimen zijn.
         * Dat kunnen drie callbacks ook prima generiek.
         * @param bericht
         * @param startCallback
         * @param stopCallback
         * @param opruimenCallback
         */
        commandoTypeBerichtBehandelaar(bericht, startCallback, stopCallback, opruimenCallback) {
            if (bericht.type !== 'commando')
                return;
            const { commando } = bericht.data;
            switch (commando) {
                case 'start':
                    startCallback();
                    break;
                case 'stop':
                    stopCallback();
                    break;
                case 'opruimen':
                    opruimenCallback();
                    break;
                default:
                    throw new Error('bericht misvormd');
            }
        },
        /**
         * Bewerkt meta data object van workers en geeft dat terug.
         * roept statsworker aan met meta data object.
         * @param metaObject bestaand data object van worker.
         * @param dataObject nieuw op te slane data.
         * @param tabel boolean, of de tabel herbouwt wordt. true.
         * @param log boolean, of alle entrees van de dataObject in log komen. S
         * @returns metaObject // TODO gaat mss helemaal er uit
         */
        zetMetaData(metaObject, dataObject, tabel = true, log = true) {
            Object.entries(dataObject).forEach(([metaKey, metaValue]) => {
                metaObject[metaKey] = metaValue;
                if (log) {
                    this.log(`${metaKey} ${metaValue}`);
                }
            });
            if (tabel) {
                this.tabel(metaObject);
            }
            return metaObject;
        },
        /**
         * Als je een verkeerde workerLocatie opgeeft krijg je geen foutmelding. Nergens. De worker constrctor doet geen bestandscontrole of meld dat iig niet. Omdat kraak worker contructor als eerste super() aanroept voor de Worker constructor kan je zelf geen bestandscontrole doen. Vandaar deze wrapper. Eindresultaat van uuuuuren debuggen.
         * @param workerLocatie
         */
        maakWorker(workerLocatie) {
            if (!fs_1.default.existsSync(workerLocatie)) {
                throw new Error(`geen bestand gevonden op ${workerLocatie}`);
            }
            const workerPoging = new kraak_worker_1.KraakWorker(workerLocatie);
            if (!(workerPoging instanceof kraak_worker_1.KraakWorker)) {
                throw new Error(`KraakWorker class geeft geen kraak worker terug voor adres ${workerLocatie}`);
            }
            return workerPoging;
        }
    };
});
