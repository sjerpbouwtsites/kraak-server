import { Worker } from 'worker_threads';
import { parentPort } from 'worker_threads';
import nuts from './nuts/generiek';
/**
 * Leeft in de master thread context.
 * Is een REFERENTIE aan de worker, niet de worker zelf.
 * Initieerd de Worker. Geeft de worker naam.
 * Wrapper voor postMessage áán de worker zodat dit getyped kan worden
 * Zet in controller context message event handlers zodat workers kunnen consol.loggen en console-lijsten (log zonder [object object] onzin)
 *
 */
export class KraakWorker extends Worker {
  public workerLocatie: string | null = null;
  public workerNaam: string | null = null;

  /**
   * referentie naar statsWorker Worker class instance
   */
  public statsWorker?: KraakWorker;

  constructor(workerLocatie: string) {
    super(workerLocatie);

    this.zetNaam(workerLocatie);

    this.zetOnMessage();
    return this;
  }

  /**
   * Iedere worker moet een referentie hebben naar de statsworker om te kunnen rapporteren en loggen.
   * @param statsWorker
   */
  koppelStatsWorker(statsWorker: KraakWorker | null = null) {
    if (!statsWorker && this.workerNaam === 'stats') {
      this.statsWorker = this;
    } else if (!statsWorker && this.workerNaam !== 'stats') {
      throw new Error(
        'je probeert een niets statsworker te koppelen aan zichtzelf in koppel stats worker'
      );
    } else if (statsWorker) {
      this.statsWorker = statsWorker;
    }
  }

  /**
   * oude log methode... gehouden omdat de logger in
   * de browser kapot kan gaan vanwege redenen
   * deze is handig erbij
   * @deprecated
   */
  console(bericht: KraakBerichtVanWorker) {
    console.log(`${bericht.data} ${this.workerNaam?.padStart(25)}     `);
  }

  /**
   * als worker message naar master thread stuurt.
   */
  zetOnMessage(): KraakWorker {
    this.on('message', (bericht: KraakBerichtVanWorker) => {
      if (bericht.type === 'console') {
        this.console(bericht);
      }

      if (bericht.type === 'status') {
        if (!this.statsWorker) {
          throw new Error(`KOPPEL EERST DE STATWORKER AAN ${this.workerNaam}`);
          return;
        }

        if (!bericht?.data.tabel && !bericht?.data.log) {
          parentPort?.postMessage({
            type: 'console',
            data: `${this.workerNaam} statusUpdate object niet goed gevormd.`
          });
        }

        const debugBericht: KraakDebugBericht = {
          type: 'subtaak-delegatie',
          data: {
            log: bericht?.data?.log,
            naam: bericht?.data?.naam || this.workerNaam || 'onbekend',
            tabel: bericht?.data?.tabel
          }
        };

        this.statsWorker?.berichtAanWorker(debugBericht);
      }
    });
    return this;
  }
  zetNaam(workerLocatie: string): KraakWorker {
    const wl = workerLocatie.split('/');
    this.workerNaam = wl[wl.length - 1].replace('.js', '');
    return this;
  }
  /**
   * wrapper om type KraakWorkerBericht te verplichten
   * @param bericht KraakWorkerBericht type
   */
  berichtAanWorker(bericht: KraakBerichtAanWorker): KraakWorker {
    this.postMessage(bericht);
    return this;
  }
}

export interface KraakBerichtVanWorker {
  workerNaam?: string | null;
  data?: any;
  type: 'console' | 'subtaak-delegatie' | 'status';
}

export interface KraakBerichtAanWorker {
  type: 'start' | 'stop' | 'subtaak-delegatie';
  data?: any;
}

/**
 * Met de statWorker praat je via KraakDebugBericht.
 * Naam handig voor juiste kaart indien tabeldata.
 * Log is het lopende overzicht, bronnen door elkaar.
 * tabel is het object dat toegevoegd moet worden aan de kaart met de gespecificeerde naam.
 */
export interface KraakDebugBericht extends KraakBerichtAanWorker {
  type: 'subtaak-delegatie';
  data: KraakDebugData;
}

export interface KraakDebugData {
  naam?: string;
  log?: string;
  tabel?: object;
}
