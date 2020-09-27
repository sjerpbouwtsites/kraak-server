import {
  KraakWorker,
  KraakBerichtVanWorker,
  KraakBerichtAanWorker
} from './kraak-worker';
import { Worker } from 'worker_threads';
import fs from 'fs';
import http from 'http';

http
  .createServer(function (req, res) {
    const indexHTML = fs.readFileSync(__dirname + '/../public/index.html');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(indexHTML); //write a response to the client
    res.end(); //end the response
  })
  .listen(8080); //the server object listens on port 8080

const statsWorker = new KraakWorker('./build/stats/stats.js');
statsWorker.berichtAanWorker({
  type: 'start'
});

statsWorker.berichtAanWorker({
  type: 'debug',
  data: {
    naam: 'harry',
    data: {
      nee: 10,
      ja: 325
    }
  }
});

statsWorker.berichtAanWorker({
  type: 'debug',
  data: {
    naam: 'harry',
    data: {
      doei: 'ofdgf'
    }
  }
});

setTimeout(() => {
  statsWorker.berichtAanWorker({
    type: 'stop'
  });
  statsWorker.on('message', function (bericht: KraakBerichtVanWorker) {
    if (bericht.type === 'status') {
      if (bericht.data === 'dood') {
        process.exit();
      } else {
        throw new Error('statsworker wilt niet dood??' + bericht.data);
      }
    }
  });
}, 10000);

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
