/**
 * @file Die nutsfuncties die betrekking hebben op het proces
 * cq het node process, of het leven van de controller index.ts
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = {
        /**
         * Stop het gehele node process (in index.ts) zodra aanpalende apps & werkers ook beeindigd zijn
         * @param statsWorker verwijzing naar statistieken / console verwerkende worker
         */
        stop(statsWorker) {
            statsWorker.berichtAanWorker({
                type: 'stop'
            });
            statsWorker.on('message', function (bericht) {
                var _a, _b;
                if (bericht.type === 'status') {
                    if (((_b = (_a = bericht === null || bericht === void 0 ? void 0 : bericht.data) === null || _a === void 0 ? void 0 : _a.tabel) === null || _b === void 0 ? void 0 : _b.status) === 'dood') {
                        process.exit();
                    }
                    else {
                        setTimeout(() => {
                            throw (new Error('DUURT LANG afsluiten wtf'), process.exit());
                        }, 2000);
                    }
                }
            });
        },
        /**
         * Als lager dan versie 13, niet draaien.
         */
        nodeVersieControle() {
            try {
                const nodeversie = Number(process.versions.node.split('.')[0]);
                if (nodeversie < 13) {
                    throw new Error(`node versie te laag. is: ${nodeversie}`);
                }
            }
            catch (error) {
                console.error(error);
                process.exit();
            }
        }
    };
});
