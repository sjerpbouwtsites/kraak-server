/**
 * @file Worker. Ontvangt van controller de dagen waarop is gescraped
 * en verwerkt die één voor één. Hieruit worden de adressen gehaald en de kvk nummers. Faillissementen
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
        define(["require", "exports", "worker_threads", "../config", "../nuts/workers"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const worker_threads_1 = require("worker_threads");
    const config_1 = __importDefault(require("../config"));
    const workers_1 = __importDefault(require("../nuts/workers"));
    /**
     * houder van metadata, wordt heen en terug gegeven door workersNuts.zetMetaData
     */
    let faillezerMeta = {
        status: 'uit',
        fout: []
    };
    worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.on('message', (bericht) => {
        workers_1.default.commandoTypeBerichtBehandelaar(bericht, initFaillezer, stopFaillezer, ruimScraperOp);
    });
    function initFaillezer() {
        // faillezerMeta = workersNuts.zetMetaData(
        //   faillezerMeta,
        //   {
        //     status: 'gestart'
        //   },
        //   true,
        //   false
        // );
    }
    function stopFaillezer() {
        // faillezerMeta = workersNuts.zetMetaData(
        //   faillezerMeta,
        //   {
        //     status: 'gestopt'
        //   },
        //   true,
        //   false
        // );
        process.exit();
    }
    function ruimScraperOp() {
        //
    }
    worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.on('message', (bericht) => {
        if (bericht.type === 'subtaak-delegatie' && bericht.data) {
            verwerkFaillissementScrape(bericht.data);
        }
    });
    /**
     * Krijgt via postMessage inhoud van scrape binnen
     * Verwerkt tot adressen.
     */
    function verwerkFaillissementScrape(failScrapeData) {
        const Instanties = failScrapeData.Instanties;
        const toegestaneClusters = config_1.default.toegestaneClusters;
        const ontoegestaneClusters = config_1.default.ontoegestaneClusters;
        /**
         * tbv. terugzoeken uitspraken.
         */
        const uitspraakDatum = failScrapeDatumOpschoner(failScrapeData.Datum);
        /**
         * Uitspraken van die dag, per publicatiecluster.
         * Een publicatiecluster zijn x uitspraken, uit één stad, van één type publicatieClusterOmschrijving.
         */
        Instanties.forEach((instantie) => {
            instantie.Publicatieclusters.forEach((pc) => {
                if (toegestaneClusters.includes(pc.PublicatieclusterOmschrijving)) {
                    verwerkPublicatieCluster(Object.assign(pc, {
                        datum: uitspraakDatum
                    }));
                }
                else if (!ontoegestaneClusters.includes(pc.PublicatieclusterOmschrijving)) {
                    const err = new Error(`${pc.PublicatieclusterOmschrijving} niet gevonden in toegestane of ontoegestane clusters`);
                    faillezerMeta = workers_1.default.zetMetaData(faillezerMeta, {
                        status: 'fout',
                        fout: [...faillezerMeta.fout, err]
                    }, true, false);
                }
            });
        });
    }
    /**
     * Als de rechtbank een werkbare datum opsloeg krijg je de ISOstring terug.
     * Anders gok ik dat de uitspraakdatum vandaag was en krijg je die ISO.
     * @param rechtbankDatum
     * @returns datum als ISOstring
     */
    function failScrapeDatumOpschoner(rechtbankDatum) {
        var _a;
        const datumMatch = rechtbankDatum.match(/\d{13}/);
        const vandaagTijd = new Date().getTime();
        const datumTijdNummer = !!datumMatch
            ? Number((_a = datumMatch[0]) !== null && _a !== void 0 ? _a : vandaagTijd)
            : Number(vandaagTijd);
        return new Date(datumTijdNummer).toISOString();
    }
    /**
     * Functie die daadwerkelijk de adressen eruit haalt.
     */
    function verwerkPublicatieCluster(publicatieCluster) {
        const publicatieTeksten = [];
        try {
            publicatieCluster.Publicatiesoorten.forEach((pubSoort) => {
                //pubsoort is array met bijna altijd één object met keys: publicatiesoortCaption, PublicatiesNaarLocatie
                pubSoort.PublicatiesNaarLocatie.forEach((pubNaarLoc) => {
                    // hierin zitten de daadwerkelijke publicaties.
                    pubNaarLoc.Publicaties.forEach((publicatieTekst) => {
                        // nu nog de niet-bedrijven eruit halen.
                        if (publicatieTekst.includes('kvk') ||
                            publicatieTekst.includes('KvK') ||
                            publicatieTekst.includes('KVK')) {
                            publicatieTeksten.push({
                                inhoud: publicatieTekst,
                                type: publicatieCluster.PublicatieclusterOmschrijving,
                                datum: publicatieCluster.datum
                            });
                        }
                    });
                });
            });
        }
        catch (clusterfuck) {
            workers_1.default.log('fout bij doorzoeken publicatieClusters');
            faillezerMeta = workers_1.default.zetMetaData(faillezerMeta, {
                fout: [...faillezerMeta.fout, clusterfuck]
            });
        }
        // HIER PUBLICATIETEKSTEN IN DB SCHUIVEN
        // HIER ADRESSEN OPHALEN EN NIEUWE VERGELIJKEN.
        const gevondenAdressen = [];
        const gevondenKvKNummers = [];
        const gevondenKvK = [];
        publicatieTeksten.forEach((publicatieObject) => {
            // alle unieke kvkNummers hierin
            const kvkNummers = Array.from(new Set(publicatieObject.inhoud.match(/(\d{8})/)));
            kvkNummers.forEach((kvkNummer) => {
                if (!gevondenKvKNummers.includes(kvkNummer)) {
                    gevondenKvKNummers.push(kvkNummer);
                    gevondenKvK.push({
                        kvkNummer: kvkNummer,
                        datum: publicatieObject.datum,
                        faillissementsID: 'LEEG !TODO' //TODO nog relationele DB voorbouwen.
                    });
                }
            });
        });
        return gevondenKvK.map((kvk) => {
            `
    -------------
    ${kvk.kvkNummer} ${kvk.datum} ${kvk.faillissementsID}
    `;
        });
    }
});
