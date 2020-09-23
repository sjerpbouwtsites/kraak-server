import { parentPort, Worker } from 'worker_threads';

/**
 * Leeft in de master thread context.
 * Wrapper voor gedeelde functies van workers zoals console loggen,
 * status opvragen.
 */
export class KraakWorker extends Worker {
  public workerLocatie: string | null = null;
  public workerNaam: string | null = null;

  constructor(workerLocatie: string) {
    super(workerLocatie);

    this.zetNaam(workerLocatie);

    this.zetOnMessage();
    return this;
  }
  /**
   * als worker message naar master thread stuurt.
   */
  zetOnMessage() {
    this.on('message', (bericht: KraakBerichtVanWorker) => {
      if (bericht.type === 'console') {
        console.log(`
        ${this.workerNaam} worker
        ${bericht.data}`);
      }
    });
  }
  zetNaam(workerLocatie: string) {
    const wl = workerLocatie.split('/');
    this.workerNaam = wl[wl.length - 1].replace('.js', '');
  }
  /**
   * wrapper om type KraakWorkerBericht te verplichten
   * @param bericht KraakWorkerBericht type
   */
  berichtAanWorker(bericht: KraakBerichtAanWorker) {
    this.postMessage(bericht);
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
  type: 'console' | 'subtaak-delegatie';
}

export interface KraakBerichtAanWorker {
  type: 'start' | 'stop';
  data?: any;
}
