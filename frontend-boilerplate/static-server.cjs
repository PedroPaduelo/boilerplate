const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4002;
const ROOT = process.env.ROOT || path.join(__dirname, 'dist');

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
  '.map': 'application/json',
};

const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'));

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  const filePath = path.join(ROOT, url === '/' ? 'index.html' : url);
  const ext = path.extname(filePath);

  if (ext && mimeTypes[ext]) {
    try {
      const data = fs.readFileSync(filePath);
      res.writeHead(200, {
        'Content-Type': mimeTypes[ext],
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
      });
      res.end(data);
    } catch {
      res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' });
      res.end(indexHtml);
    }
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' });
    res.end(indexHtml);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend estatico servindo em http://0.0.0.0:${PORT}`);
});
