import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';

const hashes = new Set();
const hash = data => `sha256-${createHash('sha256').update(data).digest('base64')}`;
for (const page of ['dist/index.html', 'dist/v2/index.html', 'dist/simular-upgrade/index.html', 'dist/empresas/index.html']) {
  // HTML parsers normalize CRLF before executing inline scripts. Hash that same text.
  let html = (await readFile(page, 'utf8')).replace(/\r\n?/g, '\n');
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    const src = match[1].match(/\bsrc="([^"]+)"/)?.[1];
    const digest = hash(src ? await readFile(`dist${src}`) : match[2]);
    hashes.add(digest);
    if (src) html = html.replace(match[0], match[0].replace('<script ', `<script integrity="${digest}" `));
  }
  for (const match of html.matchAll(/<link\b[^>]*rel="modulepreload"[^>]*>/g)) {
    const href = match[0].match(/href="([^"]+)"/)[1];
    const digest = hash(await readFile(`dist${href}`));
    hashes.add(digest);
    html = html.replace(match[0], match[0].replace('<link ', `<link integrity="${digest}" `));
  }
  await writeFile(page, html);
}
const csp = [
  "default-src 'self'", `script-src 'self' https://www.googletagmanager.com https://link.msgsndr.com ${[...hashes].map(h => `'${h}'`).join(' ')} 'strict-dynamic'`,
  "script-src-attr 'none'", "style-src 'self' 'unsafe-inline'", "img-src 'self' data: https://www.googletagmanager.com https://*.google-analytics.com",
  "font-src 'self' data:", "media-src 'self'", "frame-src https://api.leadconnectorhq.com", "connect-src 'self' https://www.googletagmanager.com https://*.google-analytics.com https://*.google.com https://backend.leadconnectorhq.com", "object-src 'none'",
  "base-uri 'none'", "frame-ancestors 'none'", "form-action 'none'",
  "require-trusted-types-for 'script'", "trusted-types mavi-google-tag mavi-wesales",
].join('; ');
const headers = {
  'Content-Security-Policy': csp,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Strict-Transport-Security': 'max-age=31536000',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
await mkdir('deployment', { recursive: true });
await writeFile('deployment/security-headers.json', `${JSON.stringify(headers, null, 2)}\n`);
await writeFile('deployment/security-headers.conf', '# Generated for this exact build; publish with dist/.\n' +
  Object.entries(headers).map(([key, value]) => `add_header ${key} "${value}" always;`).join('\n') + '\n');

async function compress(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) { await compress(file); continue; }
    if (!['.html', '.js', '.css', '.svg', '.xml', '.txt', '.json'].includes(extname(file))) continue;
    const content = await readFile(file);
    if (content.length > 1024) await writeFile(`${file}.gz`, gzipSync(content, { level: 9 }));
  }
}
await compress('dist');
console.log('Build finalizado: integridade, CSP e arquivos gzip. Cabeçalhos em deployment/.');
