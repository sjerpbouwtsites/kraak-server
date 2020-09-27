import http from 'http';
import fs from 'fs';

export default async function () {
  return http
    .createServer(function (req, res) {
      const indexHTML = fs.readFileSync(__dirname + '/../../public/index.html');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(indexHTML);
      res.end();
    })
    .listen(8080);
}
