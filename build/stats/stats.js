/**
 * @file Worker. Houdt bij, per oorsprong, wat voor data actueel is gelogd. Schrijft naar public/index.html de 'luxe console'. Zijn kaartjes met data.
 * TOEKOMST TODO 'console-rol' soort ticker maken en scheiden van 'data overzicht'.
 * TODO: naar secundaire workers. (??)
 * TODO DIT IS ECHT EEN ZOOITJE. Maak apart een lijst met workers, een lijst met logs, een lijst met data.
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
        define(["require", "exports", "worker_threads", "open", "../nuts/workers", "../nuts/generiek", "./stats-html"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const worker_threads_1 = require("worker_threads");
    const open_1 = __importDefault(require("open"));
    const workers_1 = __importDefault(require("../nuts/workers"));
    const generiek_1 = __importDefault(require("../nuts/generiek"));
    const stats_html_1 = __importDefault(require("./stats-html"));
    let statsWorkerMeta = {
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
    function verwerkNieuweDebug(bericht) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
        worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage({
            type: 'console',
            data: generiek_1.default.objectNaarTekst(bericht)
        });
        if ((_a = bericht.data) === null || _a === void 0 ? void 0 : _a.log) {
            logData.push({
                naam: (_c = (_b = bericht.data) === null || _b === void 0 ? void 0 : _b.naam) !== null && _c !== void 0 ? _c : 'onbekend',
                log: (_d = bericht.data) === null || _d === void 0 ? void 0 : _d.log
            });
        }
        if ((_e = bericht.data) === null || _e === void 0 ? void 0 : _e.tabel) {
            const wn = (_g = (_f = bericht.data) === null || _f === void 0 ? void 0 : _f.naam) !== null && _g !== void 0 ? _g : 'geen-naam';
            const eerdereTabelData = (_h = tabelData.find((td) => td.naam === wn)) !== null && _h !== void 0 ? _h : false;
            if (!eerdereTabelData) {
                tabelData.push({
                    naam: (_k = (_j = bericht.data) === null || _j === void 0 ? void 0 : _j.naam) !== null && _k !== void 0 ? _k : 'onbekend',
                    tabel: (_l = bericht.data) === null || _l === void 0 ? void 0 : _l.tabel
                });
            }
            else {
                Object.assign(eerdereTabelData, {
                    tabel: (_m = bericht.data) === null || _m === void 0 ? void 0 : _m.tabel
                });
            }
        }
        if (!workersNamen.includes((_p = (_o = bericht.data) === null || _o === void 0 ? void 0 : _o.naam) !== null && _p !== void 0 ? _p : 'onbekend')) {
            workersNamen.push((_r = (_q = bericht.data) === null || _q === void 0 ? void 0 : _q.naam) !== null && _r !== void 0 ? _r : 'onbekend');
        }
    }
    worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.on('message', (bericht) => {
        switch (bericht.type) {
            case 'subtaak-delegatie':
                verwerkNieuweDebug(bericht);
                statHTMLWrap();
                break;
            case 'start':
                startStatWorker();
                break;
            case 'stop':
                stopStatWorker();
                break;
            default:
                statsWorkerMeta = workers_1.default.zetMetaData(statsWorkerMeta, {
                    fout: [
                        ...statsWorkerMeta.fout,
                        new Error('ongedefinieerd in swithc')
                    ]
                }, true, false);
        }
    });
    function statHTMLWrap() {
        const s = statsWorkerMeta.streaming;
        const JS = s ? StatIndexReloadJS.bestand : StatIndexAfsluitenJS.bestand;
        const HTML = s ? statHtmlReload : statHtmlAfsluiten;
        const CSS = true ? StatsIndexCSS.bestand : StatsIndexCSS.bestand;
        return stats_html_1.default(logData, tabelData, workersNamen, CSS, JS, HTML).then((r) => {
            worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage({ type: 'console', data: 'html gebouwd' });
            return r;
        });
    }
    async function startStatWorker() {
        statHTMLWrap().then(() => {
            open_1.default('http://localhost:8080');
            workers_1.default.log('gestart');
        });
    }
    /**
     * sluit statpagina af, meld status aan controller.
     */
    function stopStatWorker() {
        statsWorkerMeta.streaming = false;
        statHTMLWrap().then(() => {
            setTimeout(function () {
                statsWorkerMeta = workers_1.default.zetMetaData(statsWorkerMeta, {
                    status: 'dood'
                }, true, false);
                process.exit();
            }, 2500); // vanwege reload tijd chrome.
        });
    }
});
