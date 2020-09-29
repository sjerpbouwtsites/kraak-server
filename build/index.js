var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./kraak-worker", "./nuts/proces", "./nuts/generiek", "./stats/indexServer", "./pre-run.js"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const kraak_worker_1 = require("./kraak-worker");
    const proces_1 = __importDefault(require("./nuts/proces"));
    const generiek_1 = __importDefault(require("./nuts/generiek"));
    const indexServer_1 = __importDefault(require("./stats/indexServer"));
    const pre_run_js_1 = __importDefault(require("./pre-run.js"));
    // start http server met statWorker resultaat.
    indexServer_1.default();
    const statsWorker = new kraak_worker_1.KraakWorker('./build/stats/stats.js');
    statsWorker.koppelStatsWorker();
    statsWorker.berichtAanWorker({
        type: 'commando',
        data: { commando: 'start' }
    });
    // gebruikt tijdens dev... om fs te bewerken
    try {
        pre_run_js_1.default({ aantalRechtbankScrapesWeg: 0 });
    }
    catch (err) {
        statsWorker.berichtAanWorker({
            type: 'subtaak-delegatie',
            data: {
                naam: 'pre-run',
                tabel: err
            }
        });
    }
    proces_1.default.nodeVersieControle();
    async function init() {
        const rechtbankScraper = new kraak_worker_1.KraakWorker('./build/scrapers/rechtbanken.js');
        rechtbankScraper.koppelStatsWorker(statsWorker);
        const faillissementenLezer = new kraak_worker_1.KraakWorker('./build/secundair/faillezer.js');
        faillissementenLezer.koppelStatsWorker(statsWorker);
        rechtbankScraper.berichtAanWorker({
            type: 'commando',
            data: { commando: 'start' }
        });
        rechtbankScraper.on('message', (bericht) => {
            if (bericht.type === 'subtaak-delegatie') {
                faillissementenLezer.berichtAanWorker(bericht);
            }
        });
        generiek_1.default.time(30000).then(() => {
            // TODO als de scrapers stil zijn e.d. ??
            proces_1.default.stop(statsWorker);
        });
        // draai varia scrapers
        // try {
        //   const installatie = pakScript("installatie");
        //   const dagenDatabase = pakScript("dagen-database");
        //   const scraper = pakScript("scraper");
        //   const adressen = pakScript("adressen");
        //   const consolidatie = pakScript("consolidatie");
        //   const printMarx = pakScript("printMarx");
        //   //controleert bestaan van mappen
        //   await installatie.controleerInstallatie();
        //   const db = await dagenDatabase.pakDagenData();
        //   if (db.dagenTeDoen.length) {
        //     const scraperAntwoord = await scraper.scrapeDagen(db.dagenTeDoen);
        //     await dagenDatabase.zetGescraped(scraperAntwoord);
        //   }
        //   await adressen.zoekAdressen();
        //   await adressen.consolideerAdressen();
        //   const consolidatieAntwoord = await consolidatie.consolideerResponsesEnAdressen();
        //   // zoek per adres alle vestigingen op, schrijft die weg met datum
        //   // indien vestigingen bekend maar verouderd > 7 dagen
        //   // async op achtergrond vernieuwen
        //   const vestigingenOpgezocht = await consolidatie.zoekInKvKAndereVestingenPerAdres();
        //   console.log(
        //     clc.bgWhite.black(
        //       `\n\t\tKLAAR!\t\n\t${consolidatieAntwoord} adressen beschikbaar\t\n\t${vestigingenOpgezocht.length} vestigingen opgezocht`
        //     )
        //   );
        //   printMarx.print();
        // } catch (error) {
        //   console.error(error);
        // }
    }
    init();
});
