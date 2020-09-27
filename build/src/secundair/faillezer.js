(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "worker_threads", "../config"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const worker_threads_1 = require("worker_threads");
    const config_1 = require("../config");
    /**
     * Dit bestand ontvangt vanaf de controller de dagen waarop is gescraped
     * en verwerkt die één voor één. Hieruit worden de adressen gehaald.
     */
    worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.on('message', (bericht) => {
        if (bericht.type === 'start') {
            //
        }
        if (bericht.type === 'stop') {
            process.exit();
        }
        if (bericht.type === 'subtaak-delegatie' && !!bericht.data) {
            const antwoord = verwerkFaillissementScrape(bericht.data);
            const berichtTerug = {
                type: 'console',
                data: antwoord
            };
            worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage(berichtTerug);
        }
    });
    function startFailLezer() {
        console.log('start fail lezer');
    }
    /**
     * Krijgt via postMessage inhoud van scrape binnen
     * Verwerkt tot adressen.
     */
    function verwerkFaillissementScrape(failScrapeData) {
        // TODO beter typen
        var _a;
        const Instanties = failScrapeData.Instanties;
        const toegestaneClusters = config_1.config.opties.toegestaneClusters;
        const ontoegestaneClusters = config_1.config.opties.ontoegestaneClusters;
        /**
         * tbv. terugzoeken uitspraken.
         */
        // TODO dit is rommelig
        const datumMatch = failScrapeData.Datum.match(/\d{13}/);
        const datumTijdNummer = !!datumMatch
            ? Number((_a = datumMatch[0]) !== null && _a !== void 0 ? _a : '1388024800000')
            : 1388024800000;
        const uitspraakDatum = new Date(datumTijdNummer).toISOString();
        /**
         * Uitspraken van die dag, per publicatiecluster.
         * Een publicatiecluster zijn x uitspraken, uit één stad, van één type publicatieClusterOmschrijving.
         */
        Instanties.forEach((instantie) => {
            instantie.Publicatieclusters.forEach((pc) => {
                if (toegestaneClusters.includes(pc.PublicatieclusterOmschrijving)) {
                    verwerkPublicatieCluster(Object.assign(pc, {
                        datum: uitspraakDatum
                    }));
                }
                else if (!ontoegestaneClusters.includes(pc.PublicatieclusterOmschrijving)) {
                    throw new Error(`${pc.PublicatieclusterOmschrijving} niet gevonden in toegestane of ontoegestane clusters`);
                }
            });
        });
    }
    /**
     * Functie die daadwerkelijk de adressen eruit haalt.
     */
    function verwerkPublicatieCluster(publicatieCluster) {
        const publicatieTeksten = [];
        publicatieCluster.Publicatiesoorten.forEach((pubSoort) => {
            //pubsoort is array met bijna altijd één object met keys: publicatiesoortCaption, PublicatiesNaarLocatie
            pubSoort.PublicatiesNaarLocatie.forEach((pubNaarLoc) => {
                // hierin zitten de daadwerkelijke publicaties.
                pubNaarLoc.Publicaties.forEach((publicatieTekst) => {
                    // nu nog de niet-bedrijven eruit halen.
                    if (publicatieTekst.includes('kvk') ||
                        publicatieTekst.includes('KvK') ||
                        publicatieTekst.includes('KVK')) {
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
        const gevondenAdressen = [];
        const gevondenKvKNummers = [];
        const gevondenKvK = [];
        publicatieTeksten.forEach((publicatieObject) => {
            // alle unieke kvkNummers hierin
            const kvkNummers = Array.from(new Set(publicatieObject.inhoud.match(/(\d{8})/)));
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
});
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