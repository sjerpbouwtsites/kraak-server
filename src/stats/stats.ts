import { parentPort, Worker } from 'worker_threads';

import fs from 'fs';
import open from 'open';

/**
 * FUCKING SHIT voel me naar maar wilde dit ff bouwen
 */
class ConsoleData {
  construct() {
    console.log('hoera');
  }

  public streaming: boolean = true;

  public workers: workersO[] = [
    {
      naam: 'test',
      data: {
        ja: true
      }
    }
  ];

  voegToeAanWorkers(nieuweDebug: workersO) {
    const index = this.workers.findIndex(
      (worker) => worker.naam === nieuweDebug.naam
    );
    if (index !== -1) {
      this.workers[index].data = Object.assign(
        this.workers[index].data,
        nieuweDebug.data
      );
    } else {
      this.workers.push(nieuweDebug);
    }
    schrijfHTML();
  }

  print() {
    const namen = `
      <thead>
        ${this.workers.map((w) => `<th>${w.naam}</th>`).join('')}
      </thead>`;

    const workersTd = this.workers
      .map((w) => {
        return `
        <td>
          ${this.objectNaarTekst(w.data)}
        </td>
          `;
      })
      .join('');

    return `
      <table>
        ${namen}
        <tr>${workersTd}</tr>
      </table>
    `;
  }
  objectNaarTekst(object: any) {
    const r: string[] = [];
    for (let a in object) {
      r.push(`${a}:  ${object[a]}`);
    }
    return r.join('<br>');
  }
}

interface workersO {
  [index: string]: string | object;
  naam: string;
  data: object;
}

const consData = new ConsoleData();

parentPort?.on('message', (bericht: any) => {
  if (bericht.type === 'debug') {
    if (
      !bericht.data.hasOwnProperty('naam') ||
      !bericht.data.hasOwnProperty('data')
    ) {
      parentPort?.postMessage({
        type: 'console',
        data: 'debug object verkeerd gevormd'
      });
    }

    consData.voegToeAanWorkers(bericht.data as workersO);
  }

  if (bericht.type === 'start') {
    schrijfHTML().then(() => {
      open('http://localhost:8080');
    });

    parentPort?.postMessage({
      type: 'console',
      data: 'klaar'
    });
  }
  if (bericht.type === 'stop') {
    consData.streaming = false;
    schrijfHTML().then(() => {
      setTimeout(function () {
        parentPort?.postMessage({
          type: 'status',
          data: 'dood'
        });
        process.exit();
      }, 2500); // vanwege reload tijd chrome.
    });
  }
});

async function schrijfHTML() {
  fs.writeFileSync(
    __dirname + '/../../public/index.html',
    `
  <!DOCTYPE html>
  <body>
    <head>
      <link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css'>
      <style>
        
        th, td {
          padding: 10px;
          text-align: center;
        }
      </style>
      ${
        consData.streaming
          ? `<script>setTimeout(()=>{location.reload()}, 2500)`
          : `<script>window.close()</script>`
      }</script>
    </head>
    <html>
    
      ${consData.print()}
</html>
  </body>
  `
  );
  return true;
}
