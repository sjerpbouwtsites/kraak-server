import { KraakWorker } from './kraak-worker';
import procesNuts from './nuts/proces';
import workersNuts from './nuts/workers';
import startStatsServer from './stats/indexServer';
import preRunScripts from './pre-run.js';
// start http server met statWorker resultaat.
startStatsServer();

const statsWorker = workersNuts.maakWorker('./build/stats/stats.js');
statsWorker.koppelStatsWorker();
statsWorker.berichtAanWorker({
  type: 'commando',
  data: { commando: 'start' }
});

// gebruikt tijdens dev... om fs te bewerken
preRunScripts(statsWorker, { aantalRechtbankScrapesWeg: 0 });

procesNuts.nodeVersieControle();

async function init() {
  // maak workers
  const rechtbankScraper = workersNuts.maakWorker(
    './build/primair/rechtbanken.js'
  );
  const faillissementenLezer = workersNuts.maakWorker(
    './build/secundair/faillezer.js'
  );
  // koppel aan statsworker
  rechtbankScraper.koppelStatsWorker(statsWorker);
  faillissementenLezer.koppelStatsWorker(statsWorker);

  // start rechtbankscraper en faillissementslezer.
  [rechtbankScraper, faillissementenLezer].forEach((worker: KraakWorker) => {
    worker.berichtAanWorker({
      type: 'commando',
      data: { commando: 'start' }
    });
  });


  // nuts.time(30000).then(() => {
  //   // TODO als de scrapers stil zijn e.d. ??
  //   procesNuts.stop(statsWorker);
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
