import { resolve } from 'path';

const config: Config = {
  pad: {
    db: resolve(`${__dirname}/../db`), // buiten build folder
    nuts: resolve(`${__dirname}/nuts`),
    temp: resolve(`${__dirname}/temp`),
    scrapeRes: resolve(`${__dirname}/../scrape-res`) // buiten build folder
  },
  opties: {
    toegestaneClusters: [
      // clusters van faillissementsuitspraken
      'einde faillissementen',
      'uitspraken faillissement',
      'vereenvoudigde afwikkeling faillissementen',
      'surseances',
      'faillissementen',
      'neerlegging tussentijdse uitdelingslijst in faillissementen',
      'neerlegging slotuitdelingslijst in faillissementen'
    ],
    ontoegestaneClusters: [
      'rectificatie',
      'uitspraken schuldsanering',
      'zittingen in schuldsaneringen',
      'einde schuldsaneringen',
      'neerlegging slotuitdelingslijst in schuldsaneringen',
      'vervanging cur / bwv',
      'einde surseances',
      'uitspraken surseance',
      'schuldsaneringen',
      'zittingen in faillissementen'
    ]
  }
};

export default config;

export interface Config {
  pad: {
    db: string;
    nuts: string;
    temp: string;
    scrapeRes: string;
  };
  opties: {
    toegestaneClusters: string[];
    ontoegestaneClusters: string[];
  };
}
