import { Worker } from 'worker_threads';
import { parentPort } from 'worker_threads';
/**
 * Leeft in de master thread context.
 * Is een REFERENTIE aan de worker, niet de worker zelf.
 * Initieerd de Worker. Geeft de worker naam.
 * Wrapper voor postMessage áán de worker zodat dit getyped kan worden.
 * Via typing is alle communicatie geregeld. Zie de type defs.
 *
 * Zet in controller context message event handlers zodat workers kunnen consol.loggen en console-lijsten (log zonder [object object] onzin)
 *
 */
export class KraakWorker extends Worker {
  public workerLocatie: string | null = null;
  public workerNaam: string | null = null;
  /**
   * ! primaire scrapers weten zelf hun werk dus bepalen zelf of ze wachtend zijn
   * ! secundaire scrapers horen van hun meester-scraper of ze mogelijk nog werk krijgen.

   * betreft allemaal het Worker proces.
   * 
   * uit          - ~ is onopgestart
   * gestart      - ~ is opgestart, doet *nog* geen werk.
   * lekker-bezig  - ~ is opgestart, en is met werk bezig.
   * afwachtend   - ~ is opgestart, heeft nu geen werk, of meer komt onduidelijk
   * afgekapt     - ~ is opgelegd gestopt, maar heeft nog werk hebben.
   * mss-afgekapt - ~ is opgelegd gestopt,
   *                   maar had mogelijk meer werk gekregen.
   * verloren     - ~ gestopt door een uncaughtException
   * foute-limbo  - ~ is ogestart, ving fout af, zit nu vast
   * klaar        - ~ is opgestart, heeft nooit meer werk.
   * opgeruimd    - ~ is gestopt, heeft nooit meer werk.
   */
  public workerThreadStatus: WorkerThreadStatus = 'uit';
  /**
   * bepaalt door in welk mapje de worker zit.
   */
  public workerArbeidsRelatie: WorkerArbeidsrelatie;

  /**
   * referentie naar statsWorker Worker class instance
   */
  public statsWorker?: KraakWorker;

  constructor(workerLocatie: string) {
    super(workerLocatie);
    this.workerArbeidsRelatie = workerLocatie.includes('primair')
      ? 'primair'
      : 'secundair';
    this.zetNaam(workerLocatie);

    this.zetOnMessage();
    return this;
  }

  /**
   * Iedere worker moet een referentie hebben naar de statsworker om te kunnen rapporteren en loggen.
   * @param statsWorker
   */
  koppelStatsWorker(statsWorker: KraakWorker | null = null) {
    if (!statsWorker && this.workerNaam === 'stats') {
      this.statsWorker = this;
    } else if (!statsWorker && this.workerNaam !== 'stats') {
      throw new Error(
        'je probeert een niets statsworker te koppelen aan zichtzelf in koppel stats worker'
      );
    } else if (statsWorker) {
      this.statsWorker = statsWorker;
    }
  }

  /**
   * oude log methode... gehouden omdat de logger in
   * de browser kapot kan gaan vanwege redenen
   * deze is handig erbij
   * @deprecated
   */
  console(bericht: KraakBericht) {
    console.log(`${bericht.data} ${this.workerNaam?.padStart(25)}     `);
  }

  /**
   * als worker message naar master thread stuurt.
   */
  zetOnMessage(): KraakWorker {
    this.on('message', (bericht: KraakBericht) => {
      if (bericht.type === 'console') {
        this.console(bericht);
      }

      if (bericht.type === 'stats') {
        if (!this.statsWorker) {
          throw new Error(`KOPPEL EERST DE STATWORKER AAN ${this.workerNaam}`);
          return;
        }
        const d = bericht.data as KraakBerichtData.Stats;
        this.statsWorker?.berichtAanWorker({
          type: 'subtaak-delegatie',
          data: {
            log: d.log,
            naam: bericht.workerNaam || this.workerNaam || 'onbekend',
            tabel: d.tabel
          }
        });
      }
    });
    return this;
  }
  zetNaam(workerLocatie: string): KraakWorker {
    const wl = workerLocatie.split('/');
    this.workerNaam = wl[wl.length - 1].replace('.js', '');
    return this;
  }
  /**
   * wrapper om type KraakWorkerBericht te verplichten
   * @param bericht KraakWorkerBericht type
   */
  berichtAanWorker(bericht: KraakBericht): KraakWorker {
    console.log(`\n${this.workerNaam}`);
    console.log(bericht);
    this.postMessage(bericht);
    return this;
  }
}

export type WorkerThreadStatus =
  | 'uit'
  | 'gestart'
  | 'lekker-bezig'
  | 'afwachtend'
  | 'afgekapt'
  | 'mss-afgekapt'
  | 'verloren'
  | 'vastgelopen'
  | 'klaar'
  | 'opgeruimd';

export type WorkerThreadCommandos = 'start' | 'stop' | 'opruimen';

export type WorkerArbeidsrelatie = 'primair' | 'secundair';

export type KraakBerichtType =
  | 'subtaak-delegatie'
  | 'stats'
  | 'status-verzoek'
  | 'status-antwoord'
  | 'commando'
  | 'console';

/**
 * Via typing zijn de messages tussen threads georganiseerd.
 * KraakBericht.vanWorker is typisch van worker naar controller.
 * KraakBericht.aanWorker is typisch van controller naar worker.
 * maar zou ook kunnen veranderen.
 *
 * BerichtType:
 *   subtaak-delegatie is hoe secundaire workers aan het werk
 *   gezet worden.
 *   stats zijn de statistieken uit de threads omhoog. Worden in kraak-worker, controller dus, als subtaak-delegatie naar de stats worker gestuurd.
 *   status-verzoek  verzoekt om rapportage met WorkerThreadStatus
 *   status-antwoord is alleen reactie op status-verzoek
 *   commando veroorzaakt starten, stoppen, etc. Beperkt door relaties.
 */

export interface KraakBericht {
  type: KraakBerichtType;
  workerNaam?: string;
  data:
    | KraakBerichtData.SubtaakDelegatie
    | KraakBerichtData.Stats
    | KraakBerichtData.StatusVerzoek
    | KraakBerichtData.StatusAntwoord
    | KraakBerichtData.Commando;
}

export namespace KraakBerichtData {
  export interface SubtaakDelegatie {
    [index: string]: any;
  }
  export interface Stats {
    log?: string;
    tabel?: Record<string, unknown>;
    naam: string;
  }
  export interface StatusVerzoek {
    [index: string]: never;
  }
  export interface StatusAntwoord {
    status: WorkerThreadStatus;
    fout?: Error; // indien status
  }
  export interface Commando {
    commando: WorkerThreadCommandos;
  }
}
