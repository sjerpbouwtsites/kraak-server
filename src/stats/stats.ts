/**
 * @file Worker. Houdt bij, per oorsprong, wat voor data actueel is gelogd. Schrijft naar public/index.html de 'luxe console'. Zijn kaartjes met data.
 * TOEKOMST TODO 'console-rol' soort ticker maken en scheiden van 'data overzicht'.
 */

import { parentPort } from 'worker_threads';
import open from 'open';
import { KraakBericht, KraakBerichtData } from '../kraak-worker';
import workersNuts, { workerMetaData } from '../nuts/workers';
import nuts from '../nuts/generiek';
import statHTML from './stats-html';
import config from '../config';

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

parentPort?.on('message', (bericht: KraakBericht) => {
  workersNuts.commandoTypeBerichtBehandelaar(
    bericht,
    startStatWorker,
    stopStatWorker,
    ruimStatWorkerOp
  );
});

parentPort?.on('message', (bericht: KraakBericht) => {
  if (bericht.type === 'subtaak-delegatie') {
    verwerkNieuweDebug(bericht.data as KraakBerichtData.Stats);
    statHTMLWrap();
  }
});

/**
 * effectief handler voor on.message type 'subtaak-delegatie'
 */
function verwerkNieuweDebug(berichtData: KraakBerichtData.Stats) {
  if (berichtData?.log && berichtData?.naam) {
    logData.push(berichtData as LogStuk);
  }
  if (berichtData?.tabel && berichtData?.naam) {
    const wn = berichtData?.naam;
    const eerdereTabelData = tabelData.find((td) => td.naam === wn) ?? false;
    if (!eerdereTabelData) {
      tabelData.push({
        naam: berichtData?.naam,
        tabel: berichtData?.tabel
      });
    } else {
      Object.assign(eerdereTabelData, {
        tabel: berichtData?.tabel
      });
    }
  }
  if (!workersNamen.includes(berichtData?.naam)) {
    workersNamen.push(berichtData?.naam);
  }
}

function statHTMLWrap(): Promise<boolean> {
  const s = statsWorkerMeta.streaming;
  const JS = s ? StatIndexReloadJS.bestand : StatIndexAfsluitenJS.bestand;
  const HTML = s ? statHtmlReload : statHtmlAfsluiten;
  const CSS = true ? StatsIndexCSS.bestand : StatsIndexCSS.bestand;
  return statHTML(logData, tabelData, workersNamen, CSS, JS, HTML).then(
    (r: any) => r
  );
}

function startStatWorker(): void {
  statHTMLWrap().then(() => {
    open(`http://localhost:${config.server.publicPort}`);
    workersNuts.log('gestart');
  });
}

/**
 * sluit statpagina af, meld status aan controller.
 */
function stopStatWorker(): void {
  workersNuts.log('gestopt');
  statsWorkerMeta.streaming = false;
  statHTMLWrap().then(() => {
    setTimeout(function () {
      parentPort?.postMessage({
        type: 'status-antwoord',
        data: {
          status: 'opgeruimd' // moet afhankelijk van het pad worden.s
        }
      });
      process.exit();
    }, 2500); // vanwege reload tijd chrome.
  });
}

function ruimStatWorkerOp(): void {
  //
}

export interface LogStuk {
  naam: string;
  log: string;
}
export interface TabelStuk {
  naam: string;
  tabel: object;
}
