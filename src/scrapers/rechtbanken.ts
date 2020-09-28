/**
 * @file Worker. Leest map scrape-res uit voor de laatste succesvolle rechtank scrape en haalt alle missende één voor één op. 'gevulde' scrape resultaten worden als bestand opgeslagen & via referentie aan de controller doorgegeven.
 */

// TODO in maken lijst met te scrapen, meenemen wat in meta/rechtbanken/niet gevonden (oid weet ik veel) staat.
// TODO implementeren: werk wachtrij
// TODO implementeren: status opvragen ism. werk wachtrij

import { parentPort } from 'worker_threads';
import * as fs from 'fs';
import { config } from '../config';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { KraakBerichtAanWorker } from '../kraak-worker';

// TODO eruit halen en vervangen door statworker.
const rbScrapeConfig = {
  consoleOpKlaar: true,
  consoleOpScrapeBestandSucces: true
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
      // TODO naar statworker
      parentPort?.postMessage({
        type: 'console',
        data: `ik ben klaar`
      });
      process.exit();
    } else {
      // TODO naar statworker
      parentPort?.postMessage({
        type: 'console',
        data: `ik heb een onverklaard probleem`
      });
    }
  });
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
    const pushString = datumRef.toISOString().replace(/-/g, '').substring(0, 8); // maak YYYYMMDD
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
    // TODO naar generieke worker catch functie die statworker aanstuurt via controller.
  }
  return true;
}

/**
 * Scraped losse datum & schrijft die weg
 * @param datum
 */
function scrapeDatum(this: any, datum: string): Promise<scrapeDatumAns> {
  /**
   * Organisatie functie als de rechtbanken een goed gevormd antwoord geven ZONDER resultaat.
   */
  this.scrapeResultaatLeeg = function (route: string, succesFunc: Function) {
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
    succesFunc({
      type: 'leeg',
      route: route
    });
  };

  /**
   * Organisatie functie als de rechtbanken een goed gevormd antwoord geven MET resultaat.
   */
  this.scrapeResultaatGevuld = async function (
    jsonBlob: any,
    route: string,
    succesFunc: Function
  ) {
    const opslagPad = `${config.pad.scrapeRes}/rechtbank/${route}.json`;
    return fs.writeFile(opslagPad, JSON.stringify(jsonBlob), () => {
      succesFunc({
        type: 'gevuld',
        route: route,
        json: jsonBlob
      });
    });
  };

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
          this.scrapeResultaatLeeg(route, scrapeDatumSucces);
        } else {
          this.scrapeResultaatGevuld(jsonBlob, route, scrapeDatumSucces);
        }
      })
      .catch((err: AxiosError) => {
        scrapeDatumFaal(err); // TODO
      });
  });
}
interface scrapeDatumAns {
  type: 'leeg' | 'gevuld';
  route: string;
  json?: object;
}
export interface RechtbankJSON {
  Instanties: Instantie[];
  Datum: string;
}

interface Instantie {
  PublicerendeInstantieOmschrijving: string;
  Locaties: object[];
  Publicatieclusters: Publicatieclusters;
}

class Publicatieclusters extends Array {
  [index: number]: Publicatiecluster;
}

export interface Publicatiecluster {
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

export type publicatieClusterOmschrijving =
  | 'einde faillissementen'
  | 'einde schuldsaneringen'
  | 'einde surseances'
  | 'faillissementen'
  | 'neerlegging slotuitdelingslijst in faillissementen'
  | 'neerlegging slotuitdelingslijst in schuldsaneringen'
  | 'neerlegging tussentijdse uitdelingslijst in faillissementen'
  | 'rectificatie'
  | 'schuldsaneringen'
  | 'surseances'
  | 'uitspraken  | faillissement'
  | 'uitspraken schuldsanering'
  | 'uitspraken surseance'
  | 'vereenvoudigde afwikkeling faillissementen'
  | 'vervanging cur / bwv'
  | 'zittingen in faillissementen'
  | 'zittingen in schuldsaneringen';

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

function routeNaarDatum(routeNaam: string) {
  const d = routeNaam.replace('000000.json', '');
  return new Date(
    d.substring(0, 4) + '-' + d.substring(4, 6) + '-' + d.substring(6, 8)
  );
}
