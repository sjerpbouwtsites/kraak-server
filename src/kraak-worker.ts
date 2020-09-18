import { parentPort, Worker } from 'worker_threads';

/**
 * Leeft in de master thread context.
 */
export class KraakWorker extends Worker {
  public workerLocatie: string | null = null;
  public workerNaam: string | null = null;
  constructor(workerLocatie: string) {
    super(workerLocatie);

    this.zetNaam(workerLocatie);

    this.zetOnMessage();
  }
  /**
   * als worker message naar master thread stuurt.
   */
  zetOnMessage() {
    this.on('message', (bericht: KraakWorkerBerichtVanWorker) => {
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

export interface KraakWorkerBerichtVanWorker extends KraakWorkerBericht {
  workerNaam?: string | null;
}

export interface KraakWorkerBericht {
  type: 'console' | 'init' | null;
  data?: any;
}
