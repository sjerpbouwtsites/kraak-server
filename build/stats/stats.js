/**
 * @file Worker. Houdt bij, per oorsprong, wat voor data actueel is gelogd. Schrijft naar public/index.html de 'luxe console'. Zijn kaartjes met data.
 * TOEKOMST TODO 'console-rol' soort ticker maken en scheiden van 'data overzicht'.
 * TODO: naar secundaire workers. (??)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "worker_threads", "fs", "open"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const worker_threads_1 = require("worker_threads");
    const fs_1 = __importDefault(require("fs"));
    const open_1 = __importDefault(require("open"));
    /**
     * Waarom is dit een worker? Ik had ruzie met typescript en had er ff geen zin in 😫 TODO class onzin weghalen.
     */
    class ConsoleData {
        constructor() {
            /**
             * Of de console-pagina index.html geopend moet zijn en ververst moet worden
             * of afgesloten.
             */
            this.streaming = true;
            /**
             * Dragers van de te debuggen / tabelleren data.
             * TODO naam worker is onterecht, kan ook wat anders zijn.
             */
            this.workers = [
                {
                    naam: 'test',
                    data: {
                        ja: true
                    }
                }
            ];
        }
        /**
         * Indien debugobject bestaat in this.workers, vernieuw en of vul aan. Zo nee, maak aan. Schrijf HTML.
         * TODO geen zuivere functie.
         * @param nieuweDebug
         */
        voegToeAanWorkers(nieuweDebug) {
            const index = this.workers.findIndex((worker) => worker.naam === nieuweDebug.naam);
            if (index !== -1) {
                this.workers[index].data = Object.assign(this.workers[index].data, nieuweDebug.data);
            }
            else {
                this.workers.push(nieuweDebug);
            }
            schrijfHTML();
        }
        /**
         * Maak tabel met data per worker.
         * TODO tabel is ontstaan uit verwarring. Maak fatsoenlijke kaarten
         * TODO sommige data zal niet converteerbaar zijn naar string. Zet die in een JSON object en maak die op
         */
        get workerDataTabel() {
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
        /**
         * helper van workerDataTabel
         * klapt een object uit
         * TODO gaat de fout in bij diep object.
         * @param object
         */
        objectNaarTekst(object) {
            const r = [];
            for (let a in object) {
                r.push(`${a}:  ${object[a]}`);
            }
            return r.join('<br>');
        }
    }
    const consData = new ConsoleData();
    worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.on('message', (bericht) => {
        switch (bericht.type) {
            case 'subtaak-delegatie':
                consData.voegToeAanWorkers(bericht.data);
                break;
            case 'start':
                startStatWorker();
                break;
            case 'stop':
                stopStatWorker();
                break;
            default:
                throw new Error('ongedefinieerd in swithc'); // TODO
        }
    });
    /**
     * Haalt CSS op en cached t.
     */
    const statWorkerCSS = {
        haalOp: function () {
            if (fs_1.default.existsSync(__dirname + '/../../public/statWorker.css')) {
                // TODO via config
                return (this.b = fs_1.default.readFileSync(__dirname + '/../../public/statWorker.css', // TODO via config
                {
                    encoding: 'utf-8'
                }));
            }
            else {
                consData.voegToeAanWorkers({
                    naam: 'statWorker',
                    data: {
                        log: 'stat worker css niet gevonden'
                    }
                });
            }
            return '';
        },
        b: '',
        get bestand() {
            if (!this.b) {
                return this.haalOp();
            }
            else {
                return this.b;
            }
        }
    };
    async function startStatWorker() {
        const CSS = await statWorkerCSS.bestand;
        schrijfHTML().then(() => {
            open_1.default('http://localhost:8080');
            worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage({
                type: 'console',
                data: 'gestart'
            });
        });
    }
    /**
     * sluit statpagina af, meld status aan controller.
     */
    function stopStatWorker() {
        consData.streaming = false;
        schrijfHTML().then(() => {
            setTimeout(function () {
                worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage({
                    type: 'status',
                    data: 'dood'
                });
                process.exit();
            }, 2500); // vanwege reload tijd chrome.
        });
    }
    /**
     * CLASSIC SLORDIGE SHIT. deal with it. Was heel ding met websockets aan het maken blablabla en en en en... fuck it. Smerig & effectief.
     * draait HTML & JS uit in index.html afhankelijk van consData.streaming.
     * of hij ververst, of hij sluit.
     */
    async function schrijfHTML() {
        const css = statWorkerCSS.bestand;
        const jsReload = `
    const rt = 1000
     
    setTimeout(()=>{
      location.reload()
    }, rt)
  `; // TODO naar bestand
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
  `; // TODO naar bestand
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
        fs_1.default.writeFileSync(__dirname + '/../../public/index.html', // TODO via config
        `
  <!DOCTYPE html>
  <body>
    <head>
      <link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css'>
      <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet"> 
      <style>
        ${css}
      </style>
    </head>
    <html>
        <div class='kraak-stats'>
          ${htmlBlob}
          ${consData.workerDataTabel}
        </div>
      <script>
        ${jsBlob}
       </script>      
</html>
  </body>
  `);
        return true;
    }
});
