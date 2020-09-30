/**
 * gemene nutsfuncties van de varia workers.
 */

import { parentPort } from 'worker_threads';
import { KraakBerichtData, KraakBericht, KraakWorker } from '../kraak-worker';
import fs from 'fs';

export default {
  /**
   * naam wordt toegevoegd door kraak-worker, waar het quasi-doorheen gaat.
   * @param logbericht string
   */
  log(logbericht: string) {
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
  tabel(teTabelleren: object) {
    const ppMessage: KraakBericht = {
      type: 'stats',
      data: {
        tabel: teTabelleren
      } as KraakBerichtData.Stats
    };
    parentPort?.postMessage(ppMessage);
  },
  /**
   * Kort voor de parentPort methode.
   * @param data
   */
  subtaakDelegatie(data: any) {
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
    startCallback: Function,
    stopCallback: Function,
    opruimenCallback: Function
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
   * Bewerkt meta data object van workers en geeft dat terug.
   * roept statsworker aan met meta data object.
   * @param metaObject bestaand data object van worker.
   * @param dataObject nieuw op te slane data.
   * @param tabel boolean, of de tabel herbouwt wordt. true.
   * @param log boolean, of alle entrees van de dataObject in log komen. S
   * @returns metaObject // TODO gaat mss helemaal er uit
   */
  zetMetaData(
    metaObject: any,
    dataObject: object,
    tabel: boolean = true,
    log: boolean = true
  ): workerMetaData {
    Object.entries(dataObject).forEach(([metaKey, metaValue]) => {
      metaObject[metaKey] = metaValue;
      if (log) {
        this.log(`${metaKey} ${metaValue}`);
      }
    });
    if (tabel) {
      this.tabel(metaObject);
    }
    return metaObject;
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

/**
 * afgezien van fout een 'normale' gang van verloop
 */
export type workerStatus =
  | 'uit'
  | 'gestart'
  | 'klaar'
  | 'in-ruste'
  | 'gestopt'
  | 'dood'
  | 'fout';

export interface workerMetaData {
  status: workerStatus;
  fout: Error[];
  [index: string]: any;
}
