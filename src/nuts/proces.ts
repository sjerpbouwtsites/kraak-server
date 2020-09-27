import { KraakBerichtVanWorker, KraakWorker } from '../kraak-worker';

export default {
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
  }
};
