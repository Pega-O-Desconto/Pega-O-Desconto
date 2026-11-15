// Local preview of the landing page, mirroring the clean URLs from .htaccess.
// Usage: node tools/serve.js
const fs = require('fs');
const http = require('http');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'landing');
const PORT = 8090;
const ROUTES = {
  '/politica-de-privacidade': '/privacidade.html',
  '/termos-e-condicoes': '/termos.html'
};
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
  '.xml': 'application/xml'
};

http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]);
  url = ROUTES[url.replace(/\/$/, '')] || url;
  let file = path.join(ROOT, url);
  if (url.endsWith('/')) file = path.join(file, 'index.html');
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, '127.0.0.1', () => console.log('preview http://127.0.0.1:' + PORT));
