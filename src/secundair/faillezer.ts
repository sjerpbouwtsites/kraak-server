/**
 * @file Worker. Ontvangt van controller de dagen waarop is gescraped
 * en verwerkt die één voor één. Hieruit worden de adressen gehaald en de kvk nummers. Faillissementen
 */

import { parentPort } from 'worker_threads';
import config from '../config';
import { KraakBericht } from '../kraak-worker';
import {
  RechtbankJSON,
  Publicatiecluster,
  publicatieClusterOmschrijving
} from '../primair/rechtbanken';
import workersNuts, { workerMetaData } from '../nuts/workers';

/**
 * houder van metadata, wordt heen en terug gegeven door workersNuts.zetMetaData
 */
let faillezerMeta: workerMetaData = {
  status: 'uit',
  fout: []
};

parentPort?.on('message', (bericht: KraakBericht) => {
  workersNuts.commandoTypeBerichtBehandelaar(
    bericht,
    initFaillezer,
    stopFaillezer,
    ruimScraperOp
  );
});

function initFaillezer() {
  // faillezerMeta = workersNuts.zetMetaData(
  //   faillezerMeta,
  //   {
  //     status: 'gestart'
  //   },
  //   true,
  //   false
  // );
}

function stopFaillezer() {
  // faillezerMeta = workersNuts.zetMetaData(
  //   faillezerMeta,
  //   {
  //     status: 'gestopt'
  //   },
  //   true,
  //   false
  // );
  process.exit();
}

function ruimScraperOp() {
  //
}

parentPort?.on('message', (bericht: KraakBericht) => {
  if (bericht.type === 'subtaak-delegatie' && bericht.data) {
    verwerkFaillissementScrape(bericht.data as RechtbankJSON);
  }
});

/**
 * Krijgt via postMessage inhoud van scrape binnen
 * Verwerkt tot adressen.
 */
function verwerkFaillissementScrape(failScrapeData: RechtbankJSON) {
  const Instanties = failScrapeData.Instanties;
  const toegestaneClusters = config.toegestaneClusters;
  const ontoegestaneClusters = config.ontoegestaneClusters;
  /**
   * tbv. terugzoeken uitspraken.
   */
  const uitspraakDatum = failScrapeDatumOpschoner(failScrapeData.Datum);

  /**
   * Uitspraken van die dag, per publicatiecluster.
   * Een publicatiecluster zijn x uitspraken, uit één stad, van één type publicatieClusterOmschrijving.
   */
  Instanties.forEach((instantie) => {
    instantie.Publicatieclusters.forEach((pc: Publicatiecluster) => {
      if (toegestaneClusters.includes(pc.PublicatieclusterOmschrijving)) {
        verwerkPublicatieCluster(
          Object.assign(pc, {
            datum: uitspraakDatum
          })
        );
      } else if (
        !ontoegestaneClusters.includes(pc.PublicatieclusterOmschrijving)
      ) {
        const err = new Error(
          `${pc.PublicatieclusterOmschrijving} niet gevonden in toegestane of ontoegestane clusters`
        );
        faillezerMeta = workersNuts.zetMetaData(
          faillezerMeta,
          {
            status: 'fout',
            fout: [...faillezerMeta.fout, err]
          },
          true,
          false
        );
      }
    });
  });
}

/**
 * Als de rechtbank een werkbare datum opsloeg krijg je de ISOstring terug.
 * Anders gok ik dat de uitspraakdatum vandaag was en krijg je die ISO.
 * @param rechtbankDatum
 * @returns datum als ISOstring
 */
function failScrapeDatumOpschoner(rechtbankDatum: string): string {
  const datumMatch = rechtbankDatum.match(/\d{13}/);
  const vandaagTijd = new Date().getTime();
  const datumTijdNummer = !!datumMatch
    ? Number(datumMatch[0] ?? vandaagTijd)
    : Number(vandaagTijd);
  return new Date(datumTijdNummer).toISOString();
}

/**
 * Functie die daadwerkelijk de adressen eruit haalt.
 */
function verwerkPublicatieCluster(
  publicatieCluster: PublicatieclusterMetDatum
) {
  const publicatieTeksten: TijdelijkPublicatie[] = [];

  try {
    publicatieCluster.Publicatiesoorten.forEach((pubSoort) => {
      //pubsoort is array met bijna altijd één object met keys: publicatiesoortCaption, PublicatiesNaarLocatie
      pubSoort.PublicatiesNaarLocatie.forEach((pubNaarLoc) => {
        // hierin zitten de daadwerkelijke publicaties.
        pubNaarLoc.Publicaties.forEach((publicatieTekst: string) => {
          // nu nog de niet-bedrijven eruit halen.
          if (
            publicatieTekst.includes('kvk') ||
            publicatieTekst.includes('KvK') ||
            publicatieTekst.includes('KVK')
          ) {
            publicatieTeksten.push({
              inhoud: publicatieTekst,
              type: publicatieCluster.PublicatieclusterOmschrijving,
              datum: publicatieCluster.datum
            });
          }
        });
      });
    });
  } catch (clusterfuck) {
    workersNuts.log('fout bij doorzoeken publicatieClusters');
    faillezerMeta = workersNuts.zetMetaData(faillezerMeta, {
      fout: [...faillezerMeta.fout, clusterfuck]
    });
  }
  // HIER PUBLICATIETEKSTEN IN DB SCHUIVEN

  // HIER ADRESSEN OPHALEN EN NIEUWE VERGELIJKEN.
  const gevondenAdressen: adresMetDatum[] = [];
  const gevondenKvKNummers: string[] = [];
  const gevondenKvK: kvkMetDatum[] = [];

  publicatieTeksten.forEach((publicatieObject: TijdelijkPublicatie) => {
    // alle unieke kvkNummers hierin
    const kvkNummers = Array.from(
      new Set(publicatieObject.inhoud.match(/(\d{8})/))
    );
    kvkNummers.forEach((kvkNummer) => {
      if (!gevondenKvKNummers.includes(kvkNummer)) {
        gevondenKvKNummers.push(kvkNummer);
        gevondenKvK.push({
          kvkNummer: kvkNummer,
          datum: publicatieObject.datum,
          faillissementsID: 'LEEG !TODO' //TODO nog relationele DB voorbouwen.
        });
      }
    });
  });

  return gevondenKvK.map((kvk) => {
    `
    -------------
    ${kvk.kvkNummer} ${kvk.datum} ${kvk.faillissementsID}
    `;
  });
}

interface adresMetDatum {
  adres: string;
  datum: string;
}

interface kvkMetDatum {
  kvkNummer: string;
  datum: string;
  faillissementsID?: string;
}

interface PublicatieclusterMetDatum extends Publicatiecluster {
  datum: string;
}

interface TijdelijkPublicatie {
  inhoud: string;
  type: publicatieClusterOmschrijving;
  datum: string;
}
