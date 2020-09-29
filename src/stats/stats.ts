/**
 * @file Worker. Houdt bij, per oorsprong, wat voor data actueel is gelogd. Schrijft naar public/index.html de 'luxe console'. Zijn kaartjes met data.
 * TOEKOMST TODO 'console-rol' soort ticker maken en scheiden van 'data overzicht'.
 * TODO: naar secundaire workers. (??)
 * TODO DIT IS ECHT EEN ZOOITJE. Maak apart een lijst met workers, een lijst met logs, een lijst met data.
 */

import { parentPort } from 'worker_threads';
import fs from 'fs';
import open from 'open';
import { KraakDebugBericht, KraakBerichtAanWorker } from '../kraak-worker';
import workersNuts, { workerMetaData } from '../nuts/workers';
import nuts from '../nuts/generiek';
import statHTML from './stats-html';

let statsWorkerMeta: workerMetaData = {
  status: 'uit',
  fout: [],
  streaming: true
};

const logData: LogStuk[] = [];
const tabelData: TabelStuk[] = [];
const workersNamen: string[] = [];

const StatsIndexCSS = new nuts.BasisBestandOphaler('/../public/statWorker.css');
const StatIndexReloadJS = new nuts.BasisBestandOphaler(
  '/../public/stat-js-reload.js'
);
const StatIndexAfsluitenJS = new nuts.BasisBestandOphaler(
  '/../public/stat-js-reload.js'
);
const statHtmlReload = '';
const statHtmlAfsluiten = `
  <div id='afsluit-html' class='afsluit-html'>
    <h1>Deze pagina wordt afgesloten.</h1>
    <p>Programma is klaar</p>
    <button id='nietAfsluiten'>Niet afsluiten</button>
  </div>
`;

function verwerkNieuweDebug(bericht: KraakDebugBericht) {
  parentPort?.postMessage({
    type: 'console',
    data: nuts.objectNaarTekst(bericht)
  });

  if (bericht.data?.log) {
    logData.push({
      naam: bericht.data?.naam ?? 'onbekend',
      log: bericht.data?.log
    });
  }
  if (bericht.data?.tabel) {
    const wn = bericht.data?.naam ?? 'geen-naam';
    const eerdereTabelData = tabelData.find((td) => td.naam === wn) ?? false;
    if (!eerdereTabelData) {
      tabelData.push({
        naam: bericht.data?.naam ?? 'onbekend',
        tabel: bericht.data?.tabel
      });
    } else {
      Object.assign(eerdereTabelData, {
        tabel: bericht.data?.tabel
      });
    }
  }
  if (!workersNamen.includes(bericht.data?.naam ?? 'onbekend')) {
    workersNamen.push(bericht.data?.naam ?? 'onbekend');
  }
}
parentPort?.on(
  'message',
  (bericht: KraakDebugBericht | KraakBerichtAanWorker) => {
    switch (bericht.type) {
      case 'subtaak-delegatie':
        verwerkNieuweDebug(bericht as KraakDebugBericht);
        statHTMLWrap();
        break;
      case 'start':
        startStatWorker();
        break;
      case 'stop':
        stopStatWorker();
        break;
      default:
        statsWorkerMeta = workersNuts.zetMetaData(
          statsWorkerMeta,
          {
            fout: [
              ...statsWorkerMeta.fout,
              new Error('ongedefinieerd in swithc')
            ]
          },
          true,
          false
        );
    }
  }
);

function statHTMLWrap(): Promise<boolean> {
  const s = statsWorkerMeta.streaming;
  const JS = s ? StatIndexReloadJS.bestand : StatIndexAfsluitenJS.bestand;
  const HTML = s ? statHtmlReload : statHtmlAfsluiten;
  const CSS = true ? StatsIndexCSS.bestand : StatsIndexCSS.bestand;
  return statHTML(logData, tabelData, workersNamen, CSS, JS, HTML).then(
    (r: any) => {
      parentPort?.postMessage({ type: 'console', data: 'html gebouwd' });
      return r;
    }
  );
}

async function startStatWorker(): Promise<void> {
  statHTMLWrap().then(() => {
    open('http://localhost:8080');
    workersNuts.log('gestart');
  });
}

/**
 * sluit statpagina af, meld status aan controller.
 */
function stopStatWorker(): void {
  statsWorkerMeta.streaming = false;
  statHTMLWrap().then(() => {
    setTimeout(function () {
      statsWorkerMeta = workersNuts.zetMetaData(
        statsWorkerMeta,
        {
          status: 'dood'
        },
        true,
        false
      );
      process.exit();
    }, 2500); // vanwege reload tijd chrome.
  });
}

export interface LogStuk {
  naam: string;
  log: string;
}
export interface TabelStuk {
  naam: string;
  tabel: object;
}
