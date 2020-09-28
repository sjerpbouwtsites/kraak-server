/**
 * @file Dit script draait elke keer vóór de uitvoering van
 * 1. draaien van index.js
 *
 */

import * as fs from 'fs';
import { config } from './config';

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
 * geef evt. fouten terug.
 */
export default function (configVanController?: PreRunConfig): Error[] | null {
  let preE: Error[] = [];
  let e = verwijderLaatsteRechtbankScrapes(configVanController);
  if (!!e && e.length > 0) {
    preE = preE.concat(e);
    e = [];
  }
  return preE.length > 0 ? preE : null;
}

interface PreRunConfig {
  aantalRechtbankScrapesWeg: number;
}
