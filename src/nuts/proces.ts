/**
 * @file Die nutsfuncties die betrekking hebben op het proces
 * cq het node process, of het leven van de controller index.ts
 */

import { KraakBerichtVanWorker, KraakWorker } from '../kraak-worker';

export default {
  /**
   * Stop het gehele node process (in index.ts) zodra aanpalende apps & werkers ook beeindigd zijn
   * @param statsWorker verwijzing naar statistieken / console verwerkende worker
   */
  stop(statsWorker: KraakWorker) {
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
  },
  /**
   * Als lager dan versie 13, niet draaien.
   */
  nodeVersieControle() {
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
};
