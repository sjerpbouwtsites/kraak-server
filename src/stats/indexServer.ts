/**
 * @file maakt de http server aan voor index.html, waar de statworker zijn resultaat naar schrijft. Wordt geopend in browser.
 */

// TODO hele public map publiceren met server.

import http from 'http';
import fs from 'fs';
import { parentPort } from 'worker_threads';

export default async function (): Promise<http.Server | Error> {
  try {
    return http
      .createServer(function (req, res) {
        parentPort?.postMessage({
          type: 'console',
          data: 'maak server jo!'
        });

        const indexPad = `${__dirname}/../public/index.html`;
        const indexHTML = fs.readFileSync(indexPad); // TODO van nuts afhalen
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(indexHTML);
        res.end();
      })
      .listen(8080); // TODO uit opties halen
  } catch (e) {
    return new Error(e);
  }
}
