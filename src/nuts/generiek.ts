import fs from 'fs';

/**
 * @file Die nutsfuncties die generiek toe te passen zijn.
 * @throws als bestand niet gevonden wordt
 */

class BasisBestandOphaler {
  private pad: string | undefined;
  private cache: string | undefined;

  constructor(pad: string) {
    this.pad = pad;
  }
  public haalOp(): string {
    try {
      return (this.cache = fs.readFileSync(__dirname + this.pad, {
        encoding: 'utf-8'
      }));
    } catch (err) {
      const s = this.pad?.split('/') ?? 'bestandspad/raadsel.wtf';
      const soortVanNaam = s[s.length - 1].replace('.', ' ');
      throw (
        ((err.message = `${soortVanNaam} ongevonden.\n${err.message}`), err)
      );
    }
  }

  get bestand(): string {
    return this.cache || this.haalOp();
  }
}

export default {
  /**
   * promise achtige vertrager. syntax als
   * nuts.time(5000).then(func) of await nuts.time(5000);
   * @param func
   * @param tijd
   */
  time(tijd: number): Promise<void> {
    return new Promise((goed) => {
      setTimeout(goed, tijd);
    });
  },
  /**
   * converteert een willekeurig object naar tekst.
   * als een value niet een string, number oid is dan wordt de functie recursief gebruikt.
   * @param object te vertteksten
   * @param diepte gebruikt voor interne recursie
   * @param htmlStijl teruggeven met \n of <br>
   */
  objectNaarTekst(
    object: Record<string, unknown>,
    diepte = 0,
    htmlStijl = false
  ): string {
    const r: string[] = [];
    const d = diepte;
    const inspringing = d * 2;

    for (const a in object) {
      let oa = (object as { [index: string]: any })[a];
      if (
        !['boolean', 'number', 'date', 'string', 'undefined', 'null'].includes(
          typeof oa
        )
      ) {
        oa = this.objectNaarTekst(oa, d, htmlStijl);
      }
      r.push(`${a}:  - ${oa}`.padStart(inspringing));
    }
    return r.join(htmlStijl ? '\n' : '<br>');
  },
  /**
   * geeft lijst met Date objecten tussen data.
   */
  datalijstTussen(beginDatum: Date, totDatum: Date): Date[] {
    const datumRef = new Date(beginDatum); // geen directe verandering
    datumRef.setDate(datumRef.getDate() + 1); // vanaf dag ná
    const r: Date[] = [];
    while (datumRef < totDatum) {
      r.push(new Date(datumRef));
      datumRef.setDate(datumRef.getDate() + 1);
    }

    return r;
  },
  BasisBestandOphaler
};
