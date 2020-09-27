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
     * FUCKING SHIT voel me naar maar wilde dit ff bouwen
     */
    class ConsoleData {
        constructor() {
            this.streaming = true;
            this.workers = [
                {
                    naam: 'test',
                    data: {
                        ja: true
                    }
                }
            ];
        }
        construct() {
            console.log('hoera');
        }
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
        if (bericht.type === 'debug') {
            if (!bericht.data.hasOwnProperty('naam') ||
                !bericht.data.hasOwnProperty('data')) {
                worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage({
                    type: 'console',
                    data: 'debug object verkeerd gevormd'
                });
            }
            consData.voegToeAanWorkers(bericht.data);
        }
        if (bericht.type === 'start') {
            schrijfHTML().then(() => {
                open_1.default('http://localhost:8080');
            });
            worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage({
                type: 'console',
                data: 'klaar'
            });
        }
        if (bericht.type === 'stop') {
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
    });
    async function schrijfHTML() {
        fs_1.default.writeFileSync(__dirname + '/../../public/index.html', `
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
      ${consData.streaming
            ? `<script>setTimeout(()=>{location.reload()}, 2500)`
            : `<script>window.close()</script>`}</script>
    </head>
    <html>
    
      ${consData.print()}
</html>
  </body>
  `);
        return true;
    }
});
