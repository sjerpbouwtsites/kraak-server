/**
 * @file TS snapt dingen niet. of ik. Sowieso typescript.
 * build achteraf fiksen.
 * gedraaid als npm taak in de build folder
 */

import fs from 'fs';

/**
 *   handmatig de niet JS & TS bestanden uit src/public naar build/public overzetten.
 */
export function tsHelpenPublicFolderOverzetten() {
  const srcPublic = fs.readdirSync(__dirname + '/../src/public');
  srcPublic
    .filter((bestandsnaam: string) => {
      return !bestandsnaam.includes('.ts') && !bestandsnaam.includes('.js');
    })
    .forEach((bestandsnaam: string) => {
      fs.copyFileSync(
        __dirname + `/../src/public/${bestandsnaam}`,
        __dirname + `/public/${bestandsnaam}`
      );
    });
}

tsHelpenPublicFolderOverzetten();
