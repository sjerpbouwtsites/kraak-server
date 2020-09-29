import {
  KraakWorker,
  KraakBerichtVanWorker,
  KraakBerichtAanWorker
} from './kraak-worker';
import procesNuts from './nuts/proces';
import nuts from './nuts/generiek';
import startStatsServer from './stats/indexServer';
import preRunScripts from './pre-run.js';
// TODO wrapper maken van parentPort die het koppelt aan de controller om zo de berichten te kunnen typen

// start http server met statWorker resultaat.
startStatsServer();

const statsWorker = new KraakWorker('./build/stats/stats.js');
statsWorker.koppelStatsWorker();
statsWorker.berichtAanWorker({ type: 'start' });

// gebruikt tijdens dev... om fs te bewerken
try {
  preRunScripts({ aantalRechtbankScrapesWeg: 0 });
} catch (err) {
  statsWorker.berichtAanWorker({
    type: 'subtaak-delegatie',
    data: {
      naam: 'pre-run',
      tabel: err
    }
  });
}

procesNuts.nodeVersieControle();

async function init() {
  const rechtbankScraper = new KraakWorker('./build/scrapers/rechtbanken.js');
  rechtbankScraper.koppelStatsWorker(statsWorker);
  const faillissementenLezer = new KraakWorker(
    './build/secundair/faillezer.js'
  );
  faillissementenLezer.koppelStatsWorker(statsWorker);
  rechtbankScraper.berichtAanWorker({ type: 'start' });
  rechtbankScraper.on('message', (bericht: KraakBerichtVanWorker) => {
    if (bericht.type === 'subtaak-delegatie') {
      faillissementenLezer.berichtAanWorker(bericht as KraakBerichtAanWorker);
    }
  });

  nuts.time(30000).then(() => {
    // TODO als de scrapers stil zijn e.d. ??
    procesNuts.stop(statsWorker);
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
