/**
 * @file bevat functies die eenmalig gedraaid werden (of vervolgens herhaalt en daarom hieronder een prullenbak)
 */

import fs from 'fs';
import nuts from './nuts/generiek';
import { config } from './config';

// /**
//  * gedraaid bij migreren rechtbank scrape res json van v0 naar v1.
//  */
// function rbScrapeResMigratie() {
//   const rbScrapes = fs.readdirSync('scrape-res/rechtbank');
//   const [eersteScrape, laatsteScrape] = [
//     rbScrapes[0],
//     rbScrapes[rbScrapes.length - 1]
//   ]
//     .map((a: string) => {
//       return a.substring(0, 8);
//     })
//     .map((a: string) => {
//       return (
//         a.substring(0, 4) + '-' + a.substring(4, 6) + '-' + a.substring(6, 8)
//       );
//     })
//     .map((a: string) => {
//       return new Date(a);
//     });

//   const dagenLijst = nuts.datalijstTussen(eersteScrape, laatsteScrape);
//   const bestaatNiet = dagenLijst.filter((dag: Date) => {
//     const routeofzo =
//       dag.toISOString().replace(/-/g, '').substring(0, 8).padEnd(14, '0') +
//       '.json';
//     const bestand = `${config.pad.scrapeRes}/rechtbank/${routeofzo}`;
//     return !fs.existsSync(bestand);
//   });

//   const bestaatNietRoutes = bestaatNiet.map((dag: Date) => {
//     return dag.toISOString().replace(/-/g, '').substring(0, 8).padEnd(14, '0');
//   });

//   const rechtbankMeta = JSON.parse(
//     fs.readFileSync(`${config.pad.scrapeRes}/meta/rechtbankmeta.json`, 'utf-8')
//   );

//   const bla = Array.from(
//     new Set(rechtbankMeta.legeResponses.concat(bestaatNietRoutes))
//   );
//   const rechtbankMEEETAAAA = Object.assign(rechtbankMeta, {
//     legeResponses: bla
//   });
//   fs.writeFileSync(
//     `${config.pad.scrapeRes}/meta/rechtbankmeta.json`,
//     JSON.stringify(rechtbankMEEETAAAA)
//   );

//   process.exit();
// }

// rbScrapeResMigratie();
