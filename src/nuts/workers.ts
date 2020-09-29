/**
 * gemene nutsfuncties van de varia workers.
 */

import { parentPort } from 'worker_threads';
import { KraakDebugData, KraakBerichtVanWorker } from '../kraak-worker';

export default {
  /**
   * naam wordt toegevoegd door kraak-worker, waar het quasi-doorheen gaat.
   * @param logbericht string
   */
  log(logbericht: string) {
    parentPort?.postMessage({
      type: 'status',
      data: {
        log: logbericht
      }
    } as KraakBerichtVanWorker);
  },
  /**
   *
   * naam wordt toegevoegd door kraak-worker, waar het quasi-doorheen gaat.
   * @param data kan ieder object zijn.
   */
  tabel(data: object) {
    parentPort?.postMessage({
      type: 'status',
      data: {
        tabel: data
      }
    } as KraakBerichtVanWorker);
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
   * Bewerkt meta data object van workers en geeft dat terug.
   * roept statsworker aan met meta data object.
   * @param metaObject bestaand data object van worker.
   * @param dataObject nieuw op te slane data.
   * @param tabel boolean, of de tabel herbouwt wordt. true.
   * @param log boolean, of alle entrees van de dataObject in log komen. S
   * @returns metaObject
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
