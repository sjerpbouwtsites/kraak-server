/* eslint-disable @typescript-eslint/ban-ts-comment */
/**
 * @file Worker. Leest map scrape-res uit voor de laatste succesvolle rechtank scrape en haalt alle missende één voor één op. 'gevulde' scrape resultaten worden als bestand opgeslagen & via referentie aan de controller doorgegeven.
 */

import { parentPort } from 'worker_threads';
import * as fs from 'fs';
import config from '../config';
import axios, { AxiosError, AxiosResponse } from 'axios';
import nuts from '../nuts/generiek';
import { KraakBericht } from '../kraak-worker';
import workersNuts, { workerMetaData } from '../nuts/workers';

/**
 * houder van metadata, wordt heen en terug gegeven door workersNuts.zetMetaData
 */
let rechtbankMeta: workerMetaData = {
  status: 'uit',
  fout: [],
  werkTeDoen: [] // volgt hier dagenTeScrapen
};

parentPort?.on('message', (bericht: KraakBericht) => {
  workersNuts.commandoTypeBerichtBehandelaar(
    bericht,
    initScraper,
    stopScaper,
    ruimScraperOp
  );
});

/**
 * organisatie. initialisatiefunctie aangeroepen door message eventhandler.
 */
function initScraper() {
  parentPort?.postMessage({
    type: 'console',
    data: 'rechtbanken init functie'
  });
  workersNuts.log('gestart');
  const dagenTeScrapen = lijstDagenTeScrapen();
  workersNuts.tabel(dagenTeScrapen);
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
 * organisatie. Als meta werkTeDoen niet leeg, log, creer fout, anders correc afgesloten process exit.
 */
function stopScaper() {
  let werkFout: Error | null = null;
  if (rechtbankMeta.werkTeDoen.length) {
    workersNuts.log(
      `ik heb nog werk te doen maar wordt gestopt! Nog ${rechtbankMeta.werkTeDoen.length} te gaan...`
    );
    werkFout = new Error(
      'rechtbank gestopt maar werkTeDoen is nog' +
        rechtbankMeta.werkTeDoen.length
    );
  }
  rechtbankMeta = workersNuts.zetMetaData(rechtbankMeta, {
    status: 'gestopt',
    fout: werkFout ? [werkFout] : []
  });
  if (werkFout) {
    throw werkFout;
  } else {
    process.exit();
  }
}
/**
 *
 */
function ruimScraperOp() {
  workersNuts.log('ruim scraper op aangeroepen maar eigenljik leeg');
}

/**
 * lees map scrape-res/rechtbank
 * pak laatst geschreven bestand & vergelijk op datum
 * geef data terug die gescraped moeten worden
 * data als YYYY-MM-DD
 */
function lijstDagenTeScrapen(): string[] {
  const rechtbankScraperRes = (() => {
    try {
      return fs.readdirSync(`${config.pad.scrapeRes}/rechtbank`);
    } catch (err) {
      // TODO LOG NAAR STATS
      console.log(err); // ts neppen
      throw err;
    }
    // sorteren op datum/route
  })().sort((naam1: string, naam2: string) => {
    return naam1.replace(/\D/g, '') < naam2.replace(/\D/g, '') ? -1 : 1;
  });

  const laatsteScrape = rechtbankScraperRes[rechtbankScraperRes.length - 1];
  const datumRef = routeNaarDatum(laatsteScrape);

  const datumMax = new Date();

  // TODO try wrap
  const { legeResponses } = JSON.parse(
    fs.readFileSync(`${config.pad.scrapeRes}/meta/rechtbankmeta.json`, 'utf-8')
  );
  /**
   * maakt Date[], dan YYYYMMJJ[], dan filter op eerdere lege responses.
   */
  return nuts
    .datalijstTussen(datumRef, datumMax)
    .map((datum: Date) => {
      return datum.toISOString().replace(/-/g, '').substring(0, 8);
    })
    .filter((datumAchtigeString: string) => {
      return !legeResponses.includes(datumAchtigeString.padEnd(14, '0'));
    });
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
        if (jsonBlob.Instanties.length === 0) {
          scrapeResultaatLeeg(route, scrapeDatumSucces as any);
        } else {
          scrapeResultaatGevuld(jsonBlob, route, scrapeDatumSucces);
        }
      })
      .catch((err: AxiosError) => {
        scrapeDatumFaal(err);
      });
  });
}

/**
 * Organisatie functie als de rechtbanken een goed gevormd antwoord geven ZONDER resultaat.
 */
function scrapeResultaatLeeg(
  route: string,
  succesFunc: (arg: TypeRouteObj) => Record<string, unknown>
) {
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
  succesFunc: any
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

interface TypeRouteObj {
  type: string;
  route: string;
}

interface scrapeDatumAns {
  type: 'leeg' | 'gevuld';
  route: string;
  json?: Record<string, unknown>;
}
export interface RechtbankJSON {
  Instanties: Instantie[];
  Datum: string;
}

interface Instantie {
  PublicerendeInstantieOmschrijving: string;
  Locaties: Record<string, unknown>[];
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

function routeNaarDatum(routeNaam: string) {
  const d = routeNaam.replace('000000.json', '');
  return new Date(
    d.substring(0, 4) + '-' + d.substring(4, 6) + '-' + d.substring(6, 8)
  );
}
