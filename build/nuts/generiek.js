/**
 * @file Die nutsfuncties die generiek toe te passen zijn.
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
         * promise achtige vertrager. syntax als
         * nuts.time(5000).then(func) of await nuts.time(5000);
         * @param func
         * @param tijd
         */
        time(tijd) {
            return new Promise((goed) => {
                setTimeout(goed, tijd);
            });
        },
        /**
         * converteert een willekeurig object naar tekst.
         * als een value niet een string, number oid is dan wordt de functie recursief gebruikt.
         * @param object
         */
        objectNaarTekst(object, diepte = 0) {
            const r = [];
            let d = diepte;
            const inspringing = d * 2;
            for (let a in object) {
                let oa = object[a];
                if (!['boolean', 'number', 'date', 'string', 'undefined', 'null'].includes(typeof oa)) {
                    oa = this.objectNaarTekst(oa, d);
                }
                r.push(`${a}:  - ${oa}`.padStart(inspringing));
            }
            return r.join('\n');
        },
        /**
         * geeft lijst met Date objecten tussen data.
         */
        datalijstTussen(beginDatum, totDatum) {
            let datumRef = new Date(beginDatum); // geen directe verandering
            datumRef.setDate(datumRef.getDate() + 1); // vanaf dag ná
            let r = [];
            do {
                r.push(new Date(datumRef));
                datumRef.setDate(datumRef.getDate() + 1);
            } while (datumRef < totDatum);
            return r;
        }
    };
});
