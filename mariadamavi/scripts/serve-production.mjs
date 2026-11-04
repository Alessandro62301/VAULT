// Local validation server: use the same generated CSP and gzip artifacts as Nginx.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('dist');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp4': 'video/mp4', '.xml': 'application/xml', '.txt': 'text/plain' };
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = resolve(root, `.${pathname}`);
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    const type = extname(file) === '.avif' ? 'image/avif' : extname(file) === '.json' ? 'application/json; charset=utf-8' : types[extname(file)] || 'application/octet-stream';
    const headers = JSON.parse(await readFile('deployment/security-headers.json', 'utf8'));
    const hashed = pathname.startsWith('/assets/') || pathname.startsWith('/optimized/');
    const responseHeaders = { ...headers, 'Content-Type': type, 'Cache-Control': hashed ? 'public, max-age=31536000, immutable' : 'no-cache', Vary: 'Accept-Encoding' };
    let content;
    if (/\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
      try { content = await readFile(`${file}.gz`); responseHeaders['Content-Encoding'] = 'gzip'; } catch {}
    }
    content ??= await readFile(file);
    responseHeaders['Content-Length'] = content.length;
    res.writeHead(200, responseHeaders);
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found'); }
}).listen(4175, '127.0.0.1', () => console.log('Production validation: http://127.0.0.1:4175'));
