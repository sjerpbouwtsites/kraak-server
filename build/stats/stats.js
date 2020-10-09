/**
 * @file Worker. Houdt bij, per oorsprong, wat voor data actueel is gelogd. Schrijft naar public/index.html de 'luxe console'. Zijn kaartjes met data.
 * TOEKOMST TODO 'console-rol' soort ticker maken en scheiden van 'data overzicht'.
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
        define(["require", "exports", "worker_threads", "open", "../nuts/workers", "../nuts/generiek", "./stats-html", "../config"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const worker_threads_1 = require("worker_threads");
    const open_1 = __importDefault(require("open"));
    const workers_1 = __importDefault(require("../nuts/workers"));
    const generiek_1 = __importDefault(require("../nuts/generiek"));
    const stats_html_1 = __importDefault(require("./stats-html"));
    const config_1 = __importDefault(require("../config"));
    const statsWorkerMeta = {
        status: 'uit',
        fout: [],
        streaming: true
    };
    const logData = [];
    const tabelData = [];
    const workersNamen = [];
    const StatsIndexCSS = new generiek_1.default.BasisBestandOphaler('/../public/statWorker.css');
    const StatIndexReloadJS = new generiek_1.default.BasisBestandOphaler('/../public/stat-js-reload.js');
    const StatIndexAfsluitenJS = new generiek_1.default.BasisBestandOphaler('/../public/stat-js-reload.js');
    const statHtmlReload = '';
    const statHtmlAfsluiten = `
  <div id='afsluit-html' class='afsluit-html'>
    <h1>Deze pagina wordt afgesloten.</h1>
    <p>Programma is klaar</p>
    <button id='nietAfsluiten'>Niet afsluiten</button>
  </div>
`;
    worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.on('message', (bericht) => {
        workers_1.default.commandoTypeBerichtBehandelaar(bericht, startStatWorker, stopStatWorker, ruimStatWorkerOp);
    });
    worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.on('message', (bericht) => {
        if (bericht.type === 'subtaak-delegatie') {
            verwerkNieuweDebug(bericht.data);
            statHTMLWrap();
        }
    });
    /**
     * effectief handler voor on.message type 'subtaak-delegatie'
     */
    function verwerkNieuweDebug(berichtData) {
        var _a;
        if ((berichtData === null || berichtData === void 0 ? void 0 : berichtData.log) && (berichtData === null || berichtData === void 0 ? void 0 : berichtData.naam)) {
            logData.push(berichtData);
        }
        if ((berichtData === null || berichtData === void 0 ? void 0 : berichtData.tabel) && (berichtData === null || berichtData === void 0 ? void 0 : berichtData.naam)) {
            const wn = berichtData === null || berichtData === void 0 ? void 0 : berichtData.naam;
            const eerdereTabelData = (_a = tabelData.find((td) => td.naam === wn)) !== null && _a !== void 0 ? _a : false;
            if (!eerdereTabelData) {
                tabelData.push({
                    naam: berichtData === null || berichtData === void 0 ? void 0 : berichtData.naam,
                    tabel: berichtData === null || berichtData === void 0 ? void 0 : berichtData.tabel
                });
            }
            else {
                Object.assign(eerdereTabelData, {
                    tabel: berichtData === null || berichtData === void 0 ? void 0 : berichtData.tabel
                });
            }
        }
        if (!workersNamen.includes(berichtData === null || berichtData === void 0 ? void 0 : berichtData.naam)) {
            workersNamen.push(berichtData === null || berichtData === void 0 ? void 0 : berichtData.naam);
        }
    }
    function statHTMLWrap() {
        const s = statsWorkerMeta.streaming;
        const JS = s ? StatIndexReloadJS.bestand : StatIndexAfsluitenJS.bestand;
        const HTML = s ? statHtmlReload : statHtmlAfsluiten;
        const CSS = StatsIndexCSS.bestand;
        return stats_html_1.default(logData, tabelData, workersNamen, CSS, JS, HTML).then((r) => r);
    }
    function startStatWorker() {
        statHTMLWrap().then(() => {
            open_1.default(`http://localhost:${config_1.default.server.publicPort}`);
            workers_1.default.log('gestart');
        });
    }
    /**
     * sluit statpagina af, meld status aan controller.
     */
    function stopStatWorker() {
        workers_1.default.log('gestopt');
        statsWorkerMeta.streaming = false;
        statHTMLWrap().then(() => {
            setTimeout(function () {
                worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage({
                    type: 'status-antwoord',
                    data: {
                        status: 'opgeruimd' // moet afhankelijk van het pad worden.s
                    }
                });
                process.exit();
            }, 2500); // vanwege reload tijd chrome.
        });
    }
    function ruimStatWorkerOp() {
        //
    }
});
