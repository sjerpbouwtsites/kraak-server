var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "fs"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const fs_1 = __importDefault(require("fs"));
    /**
     * @file Die nutsfuncties die generiek toe te passen zijn.
     * @throws als bestand niet gevonden wordt
     */
    class BasisBestandOphaler {
        constructor(pad) {
            this.pad = pad;
        }
        haalOp() {
            var _a, _b;
            try {
                return (this.cache = fs_1.default.readFileSync(__dirname + this.pad, {
                    encoding: 'utf-8'
                }));
            }
            catch (err) {
                const s = (_b = (_a = this.pad) === null || _a === void 0 ? void 0 : _a.split('/')) !== null && _b !== void 0 ? _b : 'bestandspad/raadsel.wtf';
                const soortVanNaam = s[s.length - 1].replace('.', ' ');
                throw (((err.message = `${soortVanNaam} ongevonden.\n${err.message}`), err));
            }
        }
        get bestand() {
            return this.cache || this.haalOp();
        }
    }
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
         * @param object te vertteksten
         * @param diepte gebruikt voor interne recursie
         * @param htmlStijl teruggeven met \n of <br>
         */
        objectNaarTekst(object, diepte = 0, htmlStijl = false) {
            const r = [];
            const d = diepte;
            const inspringing = d * 2;
            for (const a in object) {
                let oa = object[a];
                if (!['boolean', 'number', 'date', 'string', 'undefined', 'null'].includes(typeof oa)) {
                    oa = this.objectNaarTekst(oa, d, htmlStijl);
                }
                r.push(`${a}:  - ${oa}`.padStart(inspringing));
            }
            return r.join(htmlStijl ? '\n' : '<br>');
        },
        /**
         * geeft lijst met Date objecten tussen data.
         */
        datalijstTussen(beginDatum, totDatum) {
            const datumRef = new Date(beginDatum); // geen directe verandering
            datumRef.setDate(datumRef.getDate() + 1); // vanaf dag ná
            const r = [];
            while (datumRef < totDatum) {
                r.push(new Date(datumRef));
                datumRef.setDate(datumRef.getDate() + 1);
            }
            return r;
        },
        BasisBestandOphaler
    };
});
