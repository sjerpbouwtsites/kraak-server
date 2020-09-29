/**
 * @file Die nutsfuncties die betrekking hebben op het proces
 * cq het node process, of het leven van de controller index.ts
 */

import { KraakBericht, KraakBerichtData, KraakWorker } from '../kraak-worker';
import nuts from './generiek';

export default {
  /**
   * Stop het gehele node process (in index.ts) zodra aanpalende apps & werkers ook beeindigd zijn
   * @param statsWorker verwijzing naar statistieken / console verwerkende worker
   */
  stop(statsWorker: KraakWorker) {
    statsWorker.berichtAanWorker({
      type: 'commando',
      data: { commando: 'stop' }
    });
    statsWorker.on('message', function (bericht: KraakBericht) {
      if (bericht.type === 'status-antwoord') {
        const bd = bericht.data as KraakBerichtData.StatusAntwoord;
        if (bd.status === 'opgeruimd') {
          process.exit();
        } else {
          setTimeout(() => {
            throw (new Error('DUURT LANG afsluiten wtf'), process.exit());
          }, 2000);
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
