/**
 * @file maakt de http server aan voor index.html, waar de statworker zijn resultaat naar schrijft. Wordt geopend in browser.
 */

// TODO hele public map publiceren met server.

import http from 'http';
import fs from 'fs';
import { parentPort } from 'worker_threads';
import config from '../config';

export default async function (): Promise<http.Server | Error> {
  try {
    return http
      .createServer(function (req, res) {
        const indexHTML = fs.readFileSync(`${config.pad.public}/index.html`);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(indexHTML);
        res.end();
      })
      .listen(config.server.publicPort);
  } catch (e) {
    return new Error(e);
  }
}
