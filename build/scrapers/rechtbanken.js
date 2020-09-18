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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "fs", "../config", "axios"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const fs = __importStar(require("fs"));
    const config_1 = require("../config");
    const axios_1 = __importDefault(require("axios"));
    /**
     * runner, uitgevoerd door index.ts
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
    /**
     * lees map scrape-res/rechtbank
     * pak laatst geschreven bestand & vergelijk op datum
     * geef data terug die gescraped moeten worden
     * data als YYYY-MM-DD
     */
    function lijstDagenTeScrapen() {
        const rechtbankScraperRes = fs.readdirSync(`${config_1.config.pad.scrapeRes}/rechtbank`);
        const laatsteScrape = rechtbankScraperRes[rechtbankScraperRes.length - 1]; // @TODO slap
        const dagenTeScrapen = [];
        let datumMax = new Date();
        datumMax.setDate(datumMax.getDate() - 1); // vandaag niet scrapen, staat mss nog niet online.
        let datumRef = routeNaarDatum(laatsteScrape);
        datumRef.setDate(datumRef.getDate() + 1); // vanaf dag ná laatste scrape gaan kijken
        do {
            const pushString = datumRef.toISOString().replace(/-/g, '').substring(0, 8);
            dagenTeScrapen.push(pushString);
            datumRef.setDate(datumRef.getDate() + 1);
        } while (datumRef < datumMax);
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
        try {
            do {
                const scrapeAns = await scrapeDatum(scrapeDag);
                console.log(scrapeAns);
                // TODO verwerk antwoord
                scrapeDag = dagenTeScrapen.shift();
            } while (scrapeDag);
        }
        catch (error) {
            console.log(error);
        }
    }
    /**
     * Scraped losse datum & schrijft die weg
     * @param datum
     */
    function scrapeDatum(datum) {
        return new Promise((scrapeDatumSucces, scrapeDatumFaal) => {
            const route = datum.replace(/-/g, '').padEnd(14, '0');
            const url = `https://insolventies.rechtspraak.nl/Services/BekendmakingenService/haalOp/${route}`;
            axios_1.default
                .get(url)
                .then((antwoord) => {
                return antwoord.data;
            })
                .then((jsonBlob) => {
                if (!instanceOfRechtbankJSON(jsonBlob)) {
                    // TODO debug die data ergens heen
                    throw new Error('rechtbank JSON geen RechtbankJSON instance. antwoord in temp map');
                }
                if (jsonBlob.Instanties.length === 0) {
                    const rechtbankMeta = JSON.parse(fs.readFileSync(`${config_1.config.pad.scrapeRes}/meta/rechtbankmeta.json`, 'utf-8'));
                    rechtbankMeta.legeResponses.push(route);
                    fs.writeFileSync(`${config_1.config.pad.scrapeRes}/meta/rechtbankmeta.json`, JSON.stringify(rechtbankMeta));
                    scrapeDatumSucces({
                        type: 'leeg',
                        route: route
                    });
                }
                else {
                    const opslagPad = `${config_1.config.pad.scrapeRes}/rechtbank/${route}.json`;
                    fs.writeFile(opslagPad, JSON.stringify(jsonBlob), () => {
                        scrapeDatumSucces({
                            type: 'gevuld',
                            route: route
                        });
                    });
                }
            })
                .catch((err) => {
                console.log('TODO!!!');
                scrapeDatumFaal(err);
            });
        });
    }
    /**
     *
     * @param jsonBlob
     * @returns boolean
     * Wie maakt er nu een 'typed' versie van JS als compileertaal terwijl
     * JS in essentie een in de browser geinterpreteerde taal is?
     * Mensen die nooit antwoorden krijgen van servers.
     *
     */
    function instanceOfRechtbankJSON(jsonBlob) {
        if (!jsonBlob.hasOwnProperty('Instanties')) {
            return false;
        }
        return true;
    }
});
