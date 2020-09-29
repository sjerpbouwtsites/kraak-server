import { LogStuk, TabelStuk } from './stats';
import fs from 'fs';
import nuts from '../nuts/generiek';
import config from '../config';

const kleurenLijst = ['#8CB3B0', '#085C67', '#0E7479', '#163F5B'];

function maakLogHTML(workersNamen: string[], logData: LogStuk[]): string {
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

function tabelKaarten(workersNamen: string[], tabelData: TabelStuk[]): string {
  return `<div class='kraak-kaarten'>
    ${tabelData
      .map((tabelStuk: TabelStuk) => {
        const wi = workersNamen.indexOf(tabelStuk.naam);
        return `
          <div class='kraak-kaart bg-kleur--${wi}'>
            <header class='kraak-kaart-header'>
              <h2 class='kraak-kaart-kop'>${tabelStuk.naam}</h2>
              <div class='kraak-kaart-brood'>
                ${nuts.objectNaarTekst(tabelStuk.tabel)}
              </div>
          </div>
        `;
      })
      .join('')}
  </div>`;
}

function kleurenCSS(workersNamen: string[]): string {
  let kleurenCSS = '';
  for (let i = 0; i < workersNamen.length; i++) {
    const k = kleurenLijst[i] ?? '#ff0000';
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
export default async function (
  logData: LogStuk[],
  tabelData: TabelStuk[],
  workersNamen: string[],
  statsIndexCSS: string,
  statIndexJS: string,
  HTML: string
): Promise<boolean> {
  fs.writeFileSync(
    `${config.pad.public}/index.html`,
    `
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
  `
  );
  return true;
}
