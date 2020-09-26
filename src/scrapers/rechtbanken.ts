import { parentPort, workerData } from 'worker_threads';
import * as fs from 'fs';
import { config } from '../config';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { KraakBerichtAanWorker } from '../kraak-worker';

/**
 * TODO BESTANDSBESCHRIJVING
 */

const rbScrapeConfig = {
  consoleOpKlaar: true,
  consoleOpScrapeBestandSucces: false
};

parentPort?.on('message', (bericht: KraakBerichtAanWorker) => {
  if (bericht.type === 'start') {
    initScraper();
  }
  if (bericht.type === 'stop') {
    process.exit();
  }
});

/**
 * initialisatiefunctie aangeroepen door message eventhandler.
 */
function initScraper() {
  const dagenTeScrapen = lijstDagenTeScrapen();
  scrapeData(dagenTeScrapen).then((scrapeExitBoodschap) => {
    if (scrapeExitBoodschap === true && rbScrapeConfig.consoleOpKlaar) {
      parentPort?.postMessage({
        type: 'console',
        data: `ik ben klaar`
      });
      process.exit();
    } else {
      parentPort?.postMessage({
        type: 'console',
        data: `ik heb een onverklaard probleem`
      });
    }
  });
}
function routeNaarDatum(routeNaam: string) {
  const d = routeNaam.replace('000000.json', '');
  return new Date(
    d.substring(0, 4) + '-' + d.substring(4, 6) + '-' + d.substring(6, 8)
  );
}

/**
 * lees map scrape-res/rechtbank
 * pak laatst geschreven bestand & vergelijk op datum
 * geef data terug die gescraped moeten worden
 * data als YYYY-MM-DD
 */
function lijstDagenTeScrapen(): string[] {
  const rechtbankScraperRes = fs.readdirSync(
    `${config.pad.scrapeRes}/rechtbank`
  );

  const laatsteScrape = rechtbankScraperRes[rechtbankScraperRes.length - 1]; // @TODO slap

  const dagenTeScrapen: string[] = [];

  let datumMax = new Date();
  datumMax.setDate(datumMax.getDate() - 1); // vandaag niet scrapen, staat mss nog niet online.

  let datumRef = routeNaarDatum(laatsteScrape);
  datumRef.setDate(datumRef.getDate() + 1); // vanaf dag ná laatste scrape gaan kijken
  do {
    const pushString = datumRef.toISOString().replace(/-/g, '').substring(0, 8);
    dagenTeScrapen.push(pushString);
    datumRef.setDate(datumRef.getDate() + 1);
  } while (datumRef < datumMax);

  return dagenTeScrapen;
}

/**
 * ontvangt array met data en scraped die tot klaar, stuk voor stuk
 * @param dagenTeScrapen
 */
async function scrapeData(dagenTeScrapen: string[]) {
  let scrapeDag = dagenTeScrapen.shift();
  if (!scrapeDag) {
    return true;
  }
  try {
    do {
      const scrapeAns = await scrapeDatum(scrapeDag);
      if (rbScrapeConfig.consoleOpScrapeBestandSucces) {
        parentPort?.postMessage({
          type: 'console',
          data: `scrapede route ${scrapeAns.route} - was ${scrapeAns.type}`
        });
      }
      if (scrapeAns.type === 'gevuld') {
        parentPort?.postMessage({
          type: 'subtaak-delegatie',
          data: scrapeAns.json
        });
      }
      scrapeDag = dagenTeScrapen.shift();
    } while (scrapeDag);
  } catch (error) {
    console.log(error); // TODO AARRGHHH lege catch
  }
  return true;
}

/**
 * Scraped losse datum & schrijft die weg
 * @param datum
 */
function scrapeDatum(datum: string): Promise<scrapeDatumAns> {
  return new Promise((scrapeDatumSucces, scrapeDatumFaal) => {
    const route = datum.replace(/-/g, '').padEnd(14, '0');
    const url = `https://insolventies.rechtspraak.nl/Services/BekendmakingenService/haalOp/${route}`;

    axios
      .get(url)
      .then((antwoord: AxiosResponse) => {
        return antwoord.data;
      })
      .then((jsonBlob: RechtbankJSON) => {
        if (!instanceOfRechtbankJSON(jsonBlob)) {
          // TODO debug die data ergens heen
          throw new Error(
            'rechtbank JSON geen RechtbankJSON instance. antwoord in temp map'
          );
        }

        if (jsonBlob.Instanties.length === 0) {
          const rechtbankMeta = JSON.parse(
            fs.readFileSync(
              `${config.pad.scrapeRes}/meta/rechtbankmeta.json`,
              'utf-8'
            )
          );
          rechtbankMeta.legeResponses.push(route);
          fs.writeFileSync(
            `${config.pad.scrapeRes}/meta/rechtbankmeta.json`,
            JSON.stringify(rechtbankMeta)
          );
          scrapeDatumSucces({
            type: 'leeg',
            route: route
          });
        } else {
          const opslagPad = `${config.pad.scrapeRes}/rechtbank/${route}.json`;
          fs.writeFile(opslagPad, JSON.stringify(jsonBlob), () => {
            scrapeDatumSucces({
              type: 'gevuld',
              route: route,
              json: jsonBlob
            });
          });
        }
      })
      .catch((err: AxiosError) => {
        console.log('TODO!!!');
        scrapeDatumFaal(err);
      });
  });
}
interface scrapeDatumAns {
  type: 'leeg' | 'gevuld';
  route: string;
  json?: object;
}
export interface RechtbankJSON {
  Instanties: Intantie[];
  Datum: string;
}

interface Intantie {
  PublicerendeInstantieOmschrijving: string;
  Locaties: object[];
  Publicatieclusters: Publicatiecluster[];
}

interface Publicatiecluster {
  PublicatieclusterOmschrijving: publicatieClusterOmschrijving;
  Publicatiesoorten: [
    {
      PublicatiesNaarLocatie: [
        {
          Publicaties: string[];
        }
      ];
    }
  ];
}

type publicatieClusterOmschrijving =
  | 'einde faillissementen'
  | 'uitspraken  | faillissement'
  | 'vereenvoudigde afwikkeling faillissementen'
  | 'surseances'
  | 'faillissementen'
  | 'neerlegging tussentijdse uitdelingslijst in faillissementen'
  | 'neerlegging slotuitdelingslijst in faillissementen'
  | 'rectificatie'
  | 'uitspraken schuldsanering'
  | 'zittingen in schuldsaneringen'
  | 'einde schuldsaneringen'
  | 'neerlegging slotuitdelingslijst in schuldsaneringen'
  | 'vervanging cur / bwv'
  | 'einde surseances'
  | 'uitspraken surseance'
  | 'schuldsaneringen'
  | 'zittingen in faillissementen';

/**
 *
 * @param jsonBlob
 * @returns boolean
 * Wie maakt er nu een 'typed' versie van JS als compileertaal terwijl
 * JS in essentie een in de browser geinterpreteerde taal is?
 * Mensen die nooit antwoorden krijgen van servers.
 *
 */
function instanceOfRechtbankJSON(jsonBlob: object): boolean {
  if (!jsonBlob.hasOwnProperty('Instanties')) {
    return false;
  }
  return true;
}
