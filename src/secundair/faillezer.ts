import { parentPort, workerData } from 'worker_threads';
import * as fs from 'fs';
import { config } from '../config';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { KraakBerichtAanWorker, KraakBerichtVanWorker } from '../kraak-worker';

/**
 * Dit bestand ontvangt vanaf de controller de dagen waarop is gescraped
 * en verwerkt die één voor één. Hieruit worden de adressen gehaald.
 */

parentPort?.on('message', (bericht: KraakBerichtAanWorker) => {
  if (bericht.type === 'start') {
    //
  }
  if (bericht.type === 'stop') {
    process.exit();
  }
  if (bericht.type === 'subtaak-delegatie') {
    verwerkFaillissementScrape(bericht.data);
  }
});

function startFailLezer() {
  console.log('start fail lezer');
}

/**
 * Krijgt via postMessage inhoud van scrape binnen
 * Verwerkt tot adressen.
 */
function verwerkFaillissementScrape(failScrapeData: object) {
  // TODO beter typen
  parentPort?.postMessage({
    type: 'console',
    data: 'kreeg data binnen!'
  });
}
