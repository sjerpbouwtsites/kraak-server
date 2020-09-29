/**
 * gemene nutsfuncties van de varia workers.
 */
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
    exports.default = {
        /**
         * naam wordt toegevoegd door kraak-worker, waar het quasi-doorheen gaat.
         * @param logbericht string
         */
        log(logbericht) {
            worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage({
                type: 'status',
                data: {
                    log: logbericht
                }
            });
        },
        /**
         *
         * naam wordt toegevoegd door kraak-worker, waar het quasi-doorheen gaat.
         * @param data kan ieder object zijn.
         */
        tabel(data) {
            worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage({
                type: 'status',
                data: {
                    tabel: data
                }
            });
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
         * Bewerkt meta data object van workers en geeft dat terug.
         * roept statsworker aan met meta data object.
         * @param metaObject bestaand data object van worker.
         * @param dataObject nieuw op te slane data.
         * @param tabel boolean, of de tabel herbouwt wordt. true.
         * @param log boolean, of alle entrees van de dataObject in log komen. S
         * @returns metaObject
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
        }
    };
});
