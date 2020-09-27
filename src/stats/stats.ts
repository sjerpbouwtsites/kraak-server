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
  const jsReload = `
    const rt = 1000
     
    setTimeout(()=>{
      location.reload()
    }, rt)
  `;

  const jsAfsluiten = `
    const rt = 5000;
    let afsluitenGaatDoor = true;
     
    const na = document.getElementById('nietAfsluiten');
    const ahtml = document.getElementById('afsluit-html');
    na.addEventListener('click', ()=>{
        afsluitenGaatDoor = false;
        ahtml.parentNode.removeChild(ahtml)  
      })
    setTimeout(()=>{
      if (afsluitenGaatDoor) {
        close();
      }
    }, rt)
  `;

  const htmlReload = '';
  const htmlAfsluiten = `
    <div id='afsluit-html' class='afsluit-html'>
      <h1>Deze pagina wordt afgesloten.</h1>
      <p>Programma is klaar</p>
      <button id='nietAfsluiten'>Niet afsluiten</button>
    </div>
  `;

  const jsBlob = consData.streaming ? jsReload : jsAfsluiten;
  const htmlBlob = consData.streaming ? htmlReload : htmlAfsluiten;

  fs.writeFileSync(
    __dirname + '/../../public/index.html',
    `
  <!DOCTYPE html>
  <body>
    <head>
      <link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css'>
      <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet"> 
      <style>
        * {
          font-family: 'Roboto', sans-serif;
        }
        th, td {
          padding: 10px;
          text-align: center;
        }
        th {
          background-color: black;
          color: white;
          font-variant: small-caps
        }
        td {
          background-color: white;
        }
        body {
          background-color: #f2f2f2;
          display: flex;
          justify-content: space-around;
          align-items: center;
          min-height: 100vh;
        }

      </style>
    </head>
    <html>
        <div class='kraak-stats'>
          ${htmlBlob}
          ${consData.print()}
        </div>
      <script>
        ${jsBlob}
       </script>      
</html>
  </body>
  `
  );
  return true;
}
