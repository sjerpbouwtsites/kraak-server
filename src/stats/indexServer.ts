/**
 * @file maakt de http server aan voor index.html, waar de statworker zijn resultaat naar schrijft. Wordt geopend in browser.
 */

// TODO hele public map publiceren met server.

import http from 'http';
import fs from 'fs';

export default async function () {
  return http
    .createServer(function (req, res) {
      const indexHTML = fs.readFileSync(__dirname + '/../../public/index.html'); // TODO van nuts afhalen
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(indexHTML);
      res.end();
    })
    .listen(8080); // TODO uit opties halen
}
