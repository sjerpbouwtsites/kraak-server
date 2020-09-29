var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "fs", "../nuts/generiek", "../config"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const fs_1 = __importDefault(require("fs"));
    const generiek_1 = __importDefault(require("../nuts/generiek"));
    const config_1 = __importDefault(require("../config"));
    const kleurenLijst = ['#8CB3B0', '#085C67', '#0E7479', '#163F5B'];
    function maakLogHTML(workersNamen, logData) {
        return logData
            .map((logStuk) => {
            // bepaalt css class
            const wi = workersNamen.indexOf(logStuk.naam);
            return `<li class='log-stuk bg-kleur--${wi}'>
          <span class='log-links'>${logStuk.log.padEnd(35)}</span>
          <span class='log-rechts'>${logStuk.naam}</span>
        </li>`;
        })
            .join('');
    }
    function tabelKaarten(workersNamen, tabelData) {
        return `<div class='kraak-kaarten'>
    ${tabelData
            .map((tabelStuk) => {
            const wi = workersNamen.indexOf(tabelStuk.naam);
            return `
          <div class='kraak-kaart bg-kleur--${wi}'>
            <header class='kraak-kaart-header'>
              <h2 class='kraak-kaart-kop'>${tabelStuk.naam}</h2>
              <div class='kraak-kaart-brood'>
                ${generiek_1.default.objectNaarTekst(tabelStuk.tabel)}
              </div>
          </div>
        `;
        })
            .join('')}
  </div>`;
    }
    function kleurenCSS(workersNamen) {
        var _a;
        let kleurenCSS = '';
        for (let i = 0; i < workersNamen.length; i++) {
            const k = (_a = kleurenLijst[i]) !== null && _a !== void 0 ? _a : '#ff0000';
            kleurenCSS += `
      .bg-kleur--${i} {
        background-color: ${k}
      }
      .letter-kleur--${i} {
        color: ${k}
      }      
    `;
        }
        return kleurenCSS;
    }
    /**
     * CLASSIC SLORDIGE SHIT. deal with it. Was heel ding met websockets aan het maken blablabla en en en en... fuck it. Smerig & effectief.
     * draait HTML & JS uit in index.html afhankelijk van consData.streaming.
     * of hij ververst, of hij sluit.
     */
    async function default_1(logData, tabelData, workersNamen, statsIndexCSS, statIndexJS, HTML) {
        fs_1.default.writeFileSync(`${config_1.default.pad.public}/index.html`, `
  <!DOCTYPE html>
  <body>
    <head>
      <link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css'>
      <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet"> 
      <style>
      ${kleurenCSS(workersNamen)}
      ${statsIndexCSS}
      </style>
    </head>
    <html>
    <ul class='kraak-log'>
      ${maakLogHTML(workersNamen, logData)}
    </ul>
        <div class='kraak-stats'>${HTML}
        ${tabelKaarten(workersNamen, tabelData)}
        </div>
        <footer class='kraak-footer'>spatie om te stoppen.</footer>
      <script>
        ${statIndexJS}
       </script>      
</html>
  </body>
  `);
        return true;
    }
    exports.default = default_1;
});
