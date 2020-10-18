/**
 * @file Dit script draait elke keer vóór de uitvoering van
 * 1. draaien van index.js
 *
 */

import * as fs from 'fs';
import config from './config';
import {KraakWorker} from "./kraak-worker";

/**
 * kan overschreven worden vanuit index.ts
 */
const preRunConfig: PreRunConfig = {
  aantalRechtbankScrapesWeg: 5
};

/**
 * Tijdens bouwen rechtbanken scrape en verwerking laatste
 * 5 kunnen verwijderen
 */
const verwijderLaatsteRechtbankScrapes = function (
  conf?: PreRunConfig
): Error[] | null {
  const rbpad = `${config.pad.scrapeRes}/rechtbank`;
  const { aantalRechtbankScrapesWeg } = conf || preRunConfig;
  const alleRechtbankScrapes = fs.readdirSync(rbpad);
  const errors: Error[] = [];
  for (let i = 0; i < aantalRechtbankScrapesWeg; i++) {
    const teVerwijderen = alleRechtbankScrapes.pop();
    try {
      fs.unlinkSync(`${rbpad}/${teVerwijderen}`);
    } catch (err) {
      errors.push(err);
    }
  }
  return errors.length > 0 ? errors : null;
};

/**
 * Runner te gebruiken in index.ts.
 */
export default function (statsWorker : KraakWorker, configVanController?: PreRunConfig): void {
  try {
    verwijderLaatsteRechtbankScrapes(configVanController);
  } catch (err) {
    statsWorker.berichtAanWorker({
      type: 'subtaak-delegatie',
      data: {
        naam: 'pre-run',
        tabel: err
      }
    });
  }

}

interface PreRunConfig {
  aantalRechtbankScrapesWeg: number;
}
