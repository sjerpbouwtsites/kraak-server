/**
 * @file Worker. Leest map scrape-res uit voor de laatste succesvolle rechtank scrape en haalt alle missende één voor één op. 'gevulde' scrape resultaten worden als bestand opgeslagen & via referentie aan de controller doorgegeven.
 */

// TODO implementeren: werk wachtrij
// TODO implementeren: status opvragen ism. werk wachtrij

import { parentPort } from 'worker_threads';
import * as fs from 'fs';
import config from '../config';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { KraakBerichtAanWorker } from '../kraak-worker';
import workersNuts, { workerMetaData } from '../nuts/workers';

/**
 * houder van metadata, wordt heen en terug gegeven door workersNuts.zetMetaData
 */
let rechtbankMeta: workerMetaData = {
  status: 'uit',
  fout: [],
  werkTeDoen: [] // volgt hier dagenTeScrapen
};

parentPort?.on('message', (bericht: KraakBerichtAanWorker) => {
  if (bericht.type === 'start') {
    rechtbankMeta = workersNuts.zetMetaData(rechtbankMeta, {
      status: 'gestart'
    });
    initScraper();
  }
  if (bericht.type === 'stop') {
    rechtbankMeta = workersNuts.zetMetaData(rechtbankMeta, {
      status: 'gestopt'
    });
    process.exit();
  }
});

/**
 * initialisatiefunctie aangeroepen door message eventhandler.
 */
function initScraper() {
  const dagenTeScrapen = lijstDagenTeScrapen();
  rechtbankMeta.werkTeDoen = dagenTeScrapen;
  scrapeData(dagenTeScrapen).then((scrapeExitBoodschap) => {
    if (scrapeExitBoodschap === true) {
      rechtbankMeta = workersNuts.zetMetaData(rechtbankMeta, {
        status: 'gestopt'
      });
      process.exit();
    } else {
      rechtbankMeta = workersNuts.zetMetaData(rechtbankMeta, {
        status: 'fout',
        fout: new Error('onbekende fout in rechtbank na scrapen')
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

  const laatsteScrape = rechtbankScraperRes[rechtbankScraperRes.length - 1];

  const dagenTeScrapen: string[] = [];

  let datumMax = new Date(); // TODO vervangen met ref naar nuts datumlijst
  datumMax.setDate(datumMax.getDate() - 1); // vandaag niet scrapen, staat mss nog niet online.

  let datumRef = routeNaarDatum(laatsteScrape);
  datumRef.setDate(datumRef.getDate() + 1); // vanaf dag ná laatste scrape gaan kijken
  // array met routes die we kunnen laten.
  const { legeResponses } = JSON.parse(
    fs.readFileSync(`${config.pad.scrapeRes}/meta/rechtbankmeta.json`, 'utf-8')
  );
  do {
    const pushString = datumRef.toISOString().replace(/-/g, '').substring(0, 8); // maak YYYYMMDD
    const pushStringRouteEq = pushString.padEnd(14, '0'); // om te vergelijken met rechtbankmetajson legeResponses.
    if (!legeResponses.includes(pushStringRouteEq)) {
      dagenTeScrapen.push(pushString);
    }
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
  rechtbankMeta.werkTeDoen = dagenTeScrapen;
  if (!scrapeDag) {
    return true;
  }
  try {
    do {
      const scrapeAns = await scrapeDatum(scrapeDag);
      workersNuts.log(
        `scrapede route ${scrapeAns.route} - was ${scrapeAns.type}`
      );
      if (scrapeAns.type === 'gevuld') {
        workersNuts.subtaakDelegatie(scrapeAns.json);
      }
      scrapeDag = dagenTeScrapen.shift();
    } while (scrapeDag);
  } catch (error) {
    throw new Error(error);
  }
  return true;
}

/**
 * Scraped losse datum & schrijft die weg
 * @param datum
 */
function scrapeDatum(this: any, datum: string): Promise<scrapeDatumAns> {
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
          scrapeResultaatLeeg(route, scrapeDatumSucces);
        } else {
          scrapeResultaatGevuld(jsonBlob, route, scrapeDatumSucces);
        }
      })
      .catch((err: AxiosError) => {
        scrapeDatumFaal(err); // TODO
      });
  });
}

/**
 * Organisatie functie als de rechtbanken een goed gevormd antwoord geven ZONDER resultaat.
 */
function scrapeResultaatLeeg(route: string, succesFunc: Function) {
  const rechtbankMeta = JSON.parse(
    fs.readFileSync(`${config.pad.scrapeRes}/meta/rechtbankmeta.json`, 'utf-8')
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
}

/**
 * Organisatie functie als de rechtbanken een goed gevormd antwoord geven MET resultaat.
 */
async function scrapeResultaatGevuld(
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
