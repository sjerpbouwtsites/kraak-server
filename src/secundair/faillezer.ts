import { parentPort, workerData } from 'worker_threads';
import * as fs from 'fs';
import { config } from '../config';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { KraakBerichtAanWorker } from '../kraak-worker';

/**
 * Dit bestand ontvangt vanaf de controller de dagen waarop is gescraped
 * en verwerkt die één voor één. Hieruit worden de adressen gehaald.
 */

parentPort?.on('message', (bericht: KraakBerichtAanWorker) => {
  if (bericht.type === 'start') {
    startFailLezer();
  }
  if (bericht.type === 'stop') {
    process.exit();
  }
});

function startFailLezer() {
  //
}
