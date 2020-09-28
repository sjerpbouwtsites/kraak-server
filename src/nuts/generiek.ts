/**
 * @file Die nutsfuncties die generiek toe te passen zijn.
 */

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
   * @param object
   */
  objectNaarTekst(object: object, diepte: number = 0): string {
    const r: string[] = [];
    let d = diepte;
    const inspringing = d * 2;
    for (let a in object) {
      let oa = (object as any)[a];
      if (
        !['boolean', 'number', 'date', 'string', 'undefined', 'null'].includes(
          typeof oa
        )
      ) {
        oa = this.objectNaarTekst(oa, d);
      }
      r.push(`${a}:  - ${oa}`.padStart(inspringing));
    }
    return r.join('\n');
  },
  /**
   * geeft lijst met Date objecten tussen data.
   */
  datalijstTussen(beginDatum: Date, totDatum: Date): Date[] {
    let datumRef = new Date(beginDatum); // geen directe verandering
    datumRef.setDate(datumRef.getDate() + 1); // vanaf dag ná
    let r: Date[] = [];
    do {
      r.push(new Date(datumRef));
      datumRef.setDate(datumRef.getDate() + 1);
    } while (datumRef < totDatum);
    return r;
  }
};
