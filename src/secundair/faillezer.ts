import fs from 'fs';
import { parentPort, workerData } from 'worker_threads';
import { config } from '../config';
import { KraakBerichtAanWorker, KraakBerichtVanWorker } from '../kraak-worker';
import {
  RechtbankJSON,
  Publicatiecluster,
  publicatieClusterOmschrijving
} from '../scrapers/rechtbanken';

/**
 * Dit bestand ontvangt vanaf de controller de dagen waarop is gescraped
 * en verwerkt die één voor één. Hieruit worden de adressen gehaald.
 */

parentPort?.on('message', (bericht: KraakBerichtAanWorker) => {
  if (bericht.type === 'start') {
    //
  }
  if (bericht.type === 'stop') {
    process.exit();
  }
  if (bericht.type === 'subtaak-delegatie' && !!bericht.data) {
    const antwoord = verwerkFaillissementScrape(bericht.data as RechtbankJSON);
    const berichtTerug: KraakBerichtVanWorker = {
      type: 'console',
      data: antwoord
    };
    parentPort?.postMessage(berichtTerug);
  }
});

function startFailLezer() {
  console.log('start fail lezer');
}

/**
 * Krijgt via postMessage inhoud van scrape binnen
 * Verwerkt tot adressen.
 */
function verwerkFaillissementScrape(failScrapeData: RechtbankJSON) {
  // TODO beter typen

  const Instanties = failScrapeData.Instanties;
  const toegestaneClusters = config.opties.toegestaneClusters;
  const ontoegestaneClusters = config.opties.ontoegestaneClusters;
  /**
   * tbv. terugzoeken uitspraken.
   */

  // TODO dit is rommelig
  const datumMatch = failScrapeData.Datum.match(/\d{13}/);
  const datumTijdNummer = !!datumMatch
    ? Number(datumMatch[0] ?? '1388024800000')
    : 1388024800000;
  const uitspraakDatum = new Date(datumTijdNummer).toISOString();

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
        throw new Error(
          `${pc.PublicatieclusterOmschrijving} niet gevonden in toegestane of ontoegestane clusters`
        );
      }
    });
  });
}

/**
 * Functie die daadwerkelijk de adressen eruit haalt.
 */
function verwerkPublicatieCluster(
  publicatieCluster: PublicatieclusterMetDatum
) {
  const publicatieTeksten: TijdelijkPublicatie[] = [];

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

  gevondenKvK;
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

// function relevantePublicatieClusters(route) {
//   const toegestaneClusters = opties.toegestaneClusters;
//   const ontoegestaneClusters = opties.ontoegestaneClusters;

//   return new Promise((resolve, reject) => {
//     try {
//       const responseBestand = nuts.pakOpslag(`responses/rechtbank/${route}`);
//       const publicatieClusters = responseBestand.Instanties.map((instantie) => {
//         return instantie.Publicatieclusters;
//       })
//         .flat()
//         .filter((pc) => {
//           const pco = pc.PublicatieclusterOmschrijving;
//           if (toegestaneClusters.includes(pco)) {
//             return true;
//           } else if (!ontoegestaneClusters.includes(pco)) {
//             console.log('pc cluster omschrijving onbekend: ' + pco);
//             return false;
//           } else {
//             return false;
//           }
//         });
//       resolve(publicatieClusters);
//     } catch (error) {
//       reject(error);
//     }
//   });
// }
