/**
 * Dit script draait elke keer vóór de uitvoering van
 * 1. draaien van index.js
 */

import * as fs from 'fs';
import { config } from './config';

/**
 * Tijdens bouwen rechtbanken scrape en verwerking laatste
 * 5 kunnen verwijderen
 */
const verwijderLaatsteVijfRechtbankScrapes = function () {
  const rbpad = `${config.pad.scrapeRes}/rechtbank`;
  const alleRechtbankScrapes = fs.readdirSync(rbpad);
  for (let i = 0; i < 5; i++) {
    const teVerwijderen = alleRechtbankScrapes.pop();
    try {
      fs.unlinkSync(`${rbpad}/${teVerwijderen}`);
    } catch (err) {
      console.error(err);
    }
  }
};

/**
 * Runner te gebruiken in index.ts
 */
export const preRunScripts = function () {
  verwijderLaatsteVijfRechtbankScrapes();
};
