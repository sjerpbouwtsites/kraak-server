import {
  KraakWorker,
  KraakBerichtVanWorker,
  KraakBerichtAanWorker
} from './kraak-worker';

// gebruikt tijdens dev... om fs te bewerken
// import { preRunScripts } from './pre-run.js';
// preRunScripts();

nodeVersieControle();

async function init() {
  const rechtbankScraper = new KraakWorker('./build/scrapers/rechtbanken.js');
  const faillissementenLezer = new KraakWorker(
    './build/secundair/faillezer.js'
  );
  rechtbankScraper.berichtAanWorker({ type: 'start' });
  rechtbankScraper.on('message', (bericht: KraakBerichtVanWorker) => {
    if (bericht.type === 'subtaak-delegatie') {
      faillissementenLezer.berichtAanWorker(bericht as KraakBerichtAanWorker);
    }
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

/**
 * Als lager dan versie 13, niet draaien.
 */
function nodeVersieControle() {
  try {
    const nodeversie = Number(process.versions.node.split('.')[0]) as number;
    if (nodeversie < 13) {
      throw new Error(`node versie te laag. is: ${nodeversie}`);
    }
  } catch (error) {
    console.error(error);
    process.exit();
  }
}
