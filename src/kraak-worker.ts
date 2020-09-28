import { Worker } from 'worker_threads';
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

  koppelStatsWorker(statsWorker: KraakWorker) {
    this.statsWorker = statsWorker;
  }

  /**
   * als worker message naar master thread stuurt.
   */
  zetOnMessage(): KraakWorker {
    this.on('message', (bericht: KraakBerichtVanWorker) => {
      if (bericht.type === 'console') {
        // TODO legacy?
        console.log(`${bericht.data} ${this.workerNaam?.padStart(25)} 
        `);
      }

      if (bericht.type === 'status') {
        if (!this.statsWorker) {
          throw new Error(`KOPPEL EERST DE STATWORKER AAN ${this.workerNaam}`);
          return;
        }

        const debugBericht: KraakDebugBericht = {
          type: 'subtaak-delegatie',
          data: {
            log: bericht?.data?.log,
            naam: this.workerNaam || 'onbekend',
            tabel: bericht.data.tabel
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

// export function workerOpExit(self: any) {
//   self.on('exit', () => {
//     parentPort?.postMessage({
//       workerNaam: 'FIX ME LATER', //TODO
//       type: 'console',
//       data: `worker op ??? gestopt`
//     });
//   });
//}

export interface KraakBerichtVanWorker {
  workerNaam?: string | null;
  data?: any;
  type: 'console' | 'console-lijst' | 'subtaak-delegatie' | 'status';
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
  data: {
    naam?: string;
    log?: string;
    tabel?: object;
  };
}
