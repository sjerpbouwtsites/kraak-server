var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./kraak-worker", "./nuts/proces", "./nuts/generiek", "./stats/indexServer"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const kraak_worker_1 = require("./kraak-worker");
    const proces_1 = __importDefault(require("./nuts/proces"));
    const generiek_1 = __importDefault(require("./nuts/generiek"));
    /**
     * node http server die public/index.html serft.
     */
    const indexServer_1 = __importDefault(require("./stats/indexServer"));
    indexServer_1.default();
    const statsWorker = new kraak_worker_1.KraakWorker('./build/stats/stats.js');
    statsWorker.berichtAanWorker({
        type: 'start'
    });
    // gebruikt tijdens dev... om fs te bewerken
    // import { preRunScripts } from './pre-run.js';
    // preRunScripts();
    // const url = 'http://localhost:8080';
    // const connection = new WebSocket(url);
    nodeVersieControle();
    async function init() {
        // const rechtbankScraper = new KraakWorker('./build/scrapers/rechtbanken.js');
        // const faillissementenLezer = new KraakWorker(
        //   './build/secundair/faillezer.js'
        // );
        // rechtbankScraper.berichtAanWorker({ type: 'start' });
        // rechtbankScraper.on('message', (bericht: KraakBerichtVanWorker) => {
        //   if (bericht.type === 'subtaak-delegatie') {
        //     faillissementenLezer.berichtAanWorker(bericht as KraakBerichtAanWorker);
        //   }
        // });
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
    generiek_1.default.time(5000).then(() => {
        proces_1.default.stop(statsWorker);
    });
    /**
     * Als lager dan versie 13, niet draaien.
     */
    function nodeVersieControle() {
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
});
