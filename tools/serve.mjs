// Lokale server om games te testen zonder internet.
//   npm run dev            → http://localhost:8080
// Open een game met ?peer=local om de lokale matchmaking-server te gebruiken.
// Vrienden op hetzelfde wifi-netwerk kunnen meedoen via het netwerkadres hieronder.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.md': 'text/plain; charset=utf-8',
};

export async function startServers({ port = 8080, peerPort = 9000, quiet = false } = {}) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/favicon.ico') { res.writeHead(204); return res.end(); }
    let file = path.join(ROOT, decodeURIComponent(url.pathname));
    if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404, { 'content-type': 'text/plain' }); return res.end('Niet gevonden'); }
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(data);
    });
  });
  await new Promise((r) => server.listen(port, '0.0.0.0', r));
  const actualPort = server.address().port;

  const { PeerServer } = await import('peer');
  const peerServer = await new Promise((resolve) => {
    const ps = PeerServer({ port: peerPort, host: '0.0.0.0', path: '/', allow_discovery: false }, (srv) => resolve({ ps, srv }));
  });
  const actualPeerPort = peerServer.srv.address().port;

  if (!quiet) {
    const ips = Object.values(os.networkInterfaces()).flat().filter((i) => i && i.family === 'IPv4' && !i.internal).map((i) => i.address);
    console.log(`\n🎮 Game-server draait!\n`);
    console.log(`   Op deze computer:  http://localhost:${actualPort}/`);
    for (const ip of ips) console.log(`   Op je wifi:        http://${ip}:${actualPort}/`);
    console.log(`\n   Tip: zet ?peer=local&peerport=${actualPeerPort} achter een game-adres om zonder internet te spelen.\n`);
  }
  return {
    port: actualPort,
    peerPort: actualPeerPort,
    close: () => { server.close(); peerServer.srv.close(); },
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServers({ port: +(process.env.PORT || 8080), peerPort: +(process.env.PEER_PORT || 9000) });
}
