var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "fs", "../config"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const fs = __importStar(require("fs"));
    const config_1 = require("../config");
    /**
     * runner
     */
    function rechtbankScrape() {
        const dagenTeScrapen = lijstDagenTeScrapen();
        scrapeData(dagenTeScrapen);
    }
    exports.default = rechtbankScrape;
    function routeNaarDatum(routeNaam) {
        const d = routeNaam.replace('000000.json', '');
        return new Date(d.substring(0, 4) + '-' + d.substring(4, 6) + '-' + d.substring(6, 8));
    }
    function lijstDagenTeScrapen() {
        const rechtbankScraperRes = fs.readdirSync(`${config_1.config.pad.scrapeRes}/rechtbank`);
        const laatsteScrape = rechtbankScraperRes[rechtbankScraperRes.length - 1]; // @TODO slap
        const dagenTeScrapen = [];
        let datumMax = new Date();
        datumMax.setDate(datumMax.getDate() - 1); // vandaag niet scrapen, staat mss nog niet online.
        let datumRef = routeNaarDatum(laatsteScrape);
        datumRef.setDate(datumRef.getDate() + 1); // vanaf dag ná laatste scrape gaan kijken
        do {
            console.log(datumRef);
            const pushString = datumRef.toISOString().replace(/-/g, '').substring(0, 8);
            dagenTeScrapen.push(pushString);
            datumRef.setDate(datumRef.getDate() + 1);
        } while (datumRef < datumMax);
        // lees map scrape-res/rechtbank
        // pak laatst geschreven bestand & vergelijk op datum
        // geef data terug die gescraped moeten worden
        return dagenTeScrapen;
    }
    /**
     * ontvangt array met data en scraped die tot klaar, stuk voor stuk
     * @param dagenTeScrapen
     */
    async function scrapeData(dagenTeScrapen) {
        let scrapeDag = dagenTeScrapen.shift();
        if (!scrapeDag) {
            return true;
        }
        do {
            const scrapeAns = await scrapeDatum(scrapeDag);
            console.log(scrapeAns);
            // TODO verwerk antwoord
            scrapeDag = dagenTeScrapen.shift();
        } while (scrapeDag);
    }
    /**
     * Scraped losse datum & schrijft die weg
     * @param datum
     */
    function scrapeDatum(datum) {
        return new Promise((scrapeDatumSucces) => {
            setTimeout(() => {
                scrapeDatumSucces(datum);
            }, 500);
        });
    }
});
