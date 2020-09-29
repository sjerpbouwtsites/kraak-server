/**
 * @file Worker. Leest map scrape-res uit voor de laatste succesvolle rechtank scrape en haalt alle missende één voor één op. 'gevulde' scrape resultaten worden als bestand opgeslagen & via referentie aan de controller doorgegeven.
 */
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
        define(["require", "exports", "worker_threads", "fs", "../config", "axios", "../nuts/generiek", "../nuts/workers"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const worker_threads_1 = require("worker_threads");
    const fs = __importStar(require("fs"));
    const config_1 = __importDefault(require("../config"));
    const axios_1 = __importDefault(require("axios"));
    const generiek_1 = __importDefault(require("../nuts/generiek"));
    const workers_1 = __importDefault(require("../nuts/workers"));
    /**
     * houder van metadata, wordt heen en terug gegeven door workersNuts.zetMetaData
     */
    let rechtbankMeta = {
        status: 'uit',
        fout: [],
        werkTeDoen: [] // volgt hier dagenTeScrapen
    };
    worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.on('message', (bericht) => {
        if (bericht.type === 'start') {
            rechtbankMeta = workers_1.default.zetMetaData(rechtbankMeta, {
                status: 'gestart'
            });
            initScraper();
        }
        if (bericht.type === 'stop') {
            stopScaper();
        }
    });
    /**
     * organisatie. initialisatiefunctie aangeroepen door message eventhandler.
     */
    function initScraper() {
        const dagenTeScrapen = lijstDagenTeScrapen();
        rechtbankMeta.werkTeDoen = dagenTeScrapen;
        scrapeData(dagenTeScrapen).then((scrapeExitBoodschap) => {
            if (scrapeExitBoodschap === true) {
                rechtbankMeta = workers_1.default.zetMetaData(rechtbankMeta, {
                    status: 'gestopt'
                });
                process.exit();
            }
            else {
                rechtbankMeta = workers_1.default.zetMetaData(rechtbankMeta, {
                    status: 'fout',
                    fout: new Error('onbekende fout in rechtbank na scrapen')
                });
            }
        });
    }
    /**
     * organisatie. Als meta werkTeDoen niet leeg, log, creer fout, anders correc afgesloten process exit.
     */
    function stopScaper() {
        let werkFout = null;
        if (rechtbankMeta.werkTeDoen.length) {
            workers_1.default.log(`ik heb nog werk te doen maar wordt gestopt! Nog ${rechtbankMeta.werkTeDoen.length} te gaan...`);
            werkFout = new Error('rechtbank gestopt maar werkTeDoen is nog' +
                rechtbankMeta.werkTeDoen.length);
        }
        rechtbankMeta = workers_1.default.zetMetaData(rechtbankMeta, {
            status: 'gestopt',
            fout: werkFout ? [werkFout] : []
        });
        if (werkFout) {
            throw werkFout;
        }
        else {
            process.exit();
        }
    }
    /**
     * lees map scrape-res/rechtbank
     * pak laatst geschreven bestand & vergelijk op datum
     * geef data terug die gescraped moeten worden
     * data als YYYY-MM-DD
     */
    function lijstDagenTeScrapen() {
        const rechtbankScraperRes = fs.readdirSync(`${config_1.default.pad.scrapeRes}/rechtbank`);
        const laatsteScrape = rechtbankScraperRes[rechtbankScraperRes.length - 1];
        let datumRef = routeNaarDatum(laatsteScrape);
        const datumMax = new Date();
        const { legeResponses } = JSON.parse(fs.readFileSync(`${config_1.default.pad.scrapeRes}/meta/rechtbankmeta.json`, 'utf-8'));
        /**
         * maakt Date[], dan YYYYMMJJ[], dan filter op eerdere lege responses.
         */
        return generiek_1.default
            .datalijstTussen(datumRef, datumMax)
            .map((datum) => {
            return datum.toISOString().replace(/-/g, '').substring(0, 8);
        })
            .filter((datumAchtigeString) => {
            return !legeResponses.includes(datumAchtigeString.padEnd(14, '0'));
        });
    }
    /**
     * ontvangt array met data en scraped die tot klaar, stuk voor stuk
     * @param dagenTeScrapen
     */
    async function scrapeData(dagenTeScrapen) {
        let scrapeDag = dagenTeScrapen.shift();
        rechtbankMeta.werkTeDoen = dagenTeScrapen;
        if (!scrapeDag) {
            return true;
        }
        try {
            do {
                const scrapeAns = await scrapeDatum(scrapeDag);
                workers_1.default.log(`scrapede route ${scrapeAns.route} - was ${scrapeAns.type}`);
                if (scrapeAns.type === 'gevuld') {
                    workers_1.default.subtaakDelegatie(scrapeAns.json);
                }
                scrapeDag = dagenTeScrapen.shift();
            } while (scrapeDag);
        }
        catch (error) {
            throw new Error(error);
        }
        return true;
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
                    const err = new Error('rechtbank JSON geen RechtbankJSON instance. antwoord in temp map');
                    rechtbankMeta.fout.push(err);
                    throw err;
                }
                if (jsonBlob.Instanties.length === 0) {
                    scrapeResultaatLeeg(route, scrapeDatumSucces);
                }
                else {
                    scrapeResultaatGevuld(jsonBlob, route, scrapeDatumSucces);
                }
            })
                .catch((err) => {
                scrapeDatumFaal(err);
            });
        });
    }
    /**
     * Organisatie functie als de rechtbanken een goed gevormd antwoord geven ZONDER resultaat.
     */
    function scrapeResultaatLeeg(route, succesFunc) {
        const rechtbankMeta = JSON.parse(fs.readFileSync(`${config_1.default.pad.scrapeRes}/meta/rechtbankmeta.json`, 'utf-8'));
        rechtbankMeta.legeResponses.push(route);
        fs.writeFileSync(`${config_1.default.pad.scrapeRes}/meta/rechtbankmeta.json`, JSON.stringify(rechtbankMeta));
        succesFunc({
            type: 'leeg',
            route: route
        });
    }
    /**
     * Organisatie functie als de rechtbanken een goed gevormd antwoord geven MET resultaat.
     */
    async function scrapeResultaatGevuld(jsonBlob, route, succesFunc) {
        const opslagPad = `${config_1.default.pad.scrapeRes}/rechtbank/${route}.json`;
        return fs.writeFile(opslagPad, JSON.stringify(jsonBlob), () => {
            succesFunc({
                type: 'gevuld',
                route: route,
                json: jsonBlob
            });
        });
    }
    class Publicatieclusters extends Array {
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
    function routeNaarDatum(routeNaam) {
        const d = routeNaam.replace('000000.json', '');
        return new Date(d.substring(0, 4) + '-' + d.substring(4, 6) + '-' + d.substring(6, 8));
    }
});
