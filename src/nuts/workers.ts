/**
 * gemene nutsfuncties van de varia workers.
 */

import { parentPort } from 'worker_threads';
import { KraakBerichtData, KraakBericht, KraakWorker,WorkerThreadMeta } from '../kraak-worker';
import fs from 'fs';



export default {
  /**
   * naam wordt toegevoegd door kraak-worker, waar het quasi-doorheen gaat.
   * @param logbericht string
   */
  log(logbericht: string) : void {
    const ppMessage: KraakBericht = {
      type: 'stats',
      data: {
        log: logbericht
      } as KraakBerichtData.Stats
    };
    parentPort?.postMessage(ppMessage);
  },
  /**
   *
   * naam wordt toegevoegd door kraak-worker, waar het quasi-doorheen gaat.
   * @param data kan ieder object zijn.
   */
  tabel(teTabelleren: Record<string, unknown>) : void {
    const ppMessage: KraakBericht = {
      type: 'stats',
      data: {
        tabel: teTabelleren
      } as KraakBerichtData.Stats
    };
    parentPort?.postMessage(ppMessage);
  },
  /**
   * Koppelstuk van thread, via post-message, naar kraak-worker, waar het op workerMeta wordt gezet.
   * naam wordt toegevoegd door kraak-worker, waar het quasi-doorheen gaat.
   * @param WorkerThreadMeta.
   */
  meta(meta: WorkerThreadMeta) : void{
    const ppMessage: KraakBericht = {
      type: 'meta',
      data: meta
    };
    parentPort?.postMessage(ppMessage);
  },
  /**
   * Kort voor de parentPort methode.
   * @param data
   */
  subtaakDelegatie<T = void>(data: T | unknown) : void{
    parentPort?.postMessage({
      type: 'subtaak-delegatie',
      data: data
    });
  },
  /**
   * bericht type commando mag slechts start, stop en opruimen zijn.
   * Dat kunnen drie callbacks ook prima generiek.
   * @param bericht
   * @param startCallback
   * @param stopCallback
   * @param opruimenCallback
   */
  commandoTypeBerichtBehandelaar(
    bericht: KraakBericht,
    startCallback: ()=>void,
    stopCallback: ()=>void,
    opruimenCallback: ()=>void
  ): void {
    if (bericht.type !== 'commando') return;
    const { commando } = bericht.data as KraakBerichtData.Commando;
    switch (commando) {
      case 'start':
        startCallback();
        break;
      case 'stop':
        stopCallback();
        break;
      case 'opruimen':
        opruimenCallback();
        break;
      default:
        throw new Error('bericht misvormd');
    }
  },

  /**
   * Als je een verkeerde workerLocatie opgeeft krijg je geen foutmelding. Nergens. De worker constrctor doet geen bestandscontrole of meld dat iig niet. Omdat kraak worker contructor als eerste super() aanroept voor de Worker constructor kan je zelf geen bestandscontrole doen. Vandaar deze wrapper. Eindresultaat van uuuuuren debuggen.
   * @param workerLocatie
   */
  maakWorker(workerLocatie: string): KraakWorker {
    if (!fs.existsSync(workerLocatie)) {
      throw new Error(`geen bestand gevonden op ${workerLocatie}`);
    }
    const workerPoging = new KraakWorker(workerLocatie);
    if (!(workerPoging instanceof KraakWorker)) {
      throw new Error(
        `KraakWorker class geeft geen kraak worker terug voor adres ${workerLocatie}`
      );
    }
    return workerPoging;
  }
};