import { createServer } from 'node:http';
import { stat, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { root } from './build.mjs';

export function serve({ port = Number(process.env.PORT || 4173), host = process.env.HOST || '127.0.0.1' } = {}) {
  const directory = path.join(root, 'dist');
  const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml', '.xml': 'application/xml' };
  const server = createServer(async (req, res) => {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, `http://${host}`).pathname); }
    catch { res.writeHead(400).end('Bad request'); return; }
    const filename = path.resolve(directory, `.${pathname}`);
    if (!filename.startsWith(`${directory}${path.sep}`) && filename !== directory) { res.writeHead(403).end('Forbidden'); return; }
    try {
      let target = filename;
      const info = await stat(target);
      if (info.isDirectory()) {
        if (!pathname.endsWith('/')) { res.writeHead(308, { Location: `${pathname}/${new URL(req.url, `http://${host}`).search}` }).end(); return; }
        target = path.join(target, 'index.html');
      }
      const body = await readFile(target);
      res.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache' });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch {
      const body = await readFile(path.join(directory, '404.html'));
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(req.method === 'HEAD' ? undefined : body);
    }
  });
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, host, () => console.log(`Local: http://${host}:${port}`));
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) serve();
