import { readFile, writeFile } from 'node:fs/promises';
const manifest = JSON.parse(await readFile('_briefing/performance-images.json', 'utf8'));
let html = await readFile('index.html', 'utf8');
// Unwrap only pictures owned by this script, so regeneration is idempotent.
html = html.replace(/<picture data-optimized>\s*<source[^>]+>\s*(<img\b[^>]*>)\s*<\/picture>/g, '$1');
for (const [name, asset] of Object.entries(manifest)) {
  if (name === 'icone-rosa') continue;
  html = html.replace(/<img\b[^>]*>/g, tag => {
    const source = tag.match(/\bsrc="([^"]+)"/)?.[1];
    if (source !== asset.source && !source?.startsWith(`/optimized/${name}-`)) return tag;
    const variants = asset.variants;
    const fallback = variants[Math.min(1, variants.length - 1)];
    const cover = ['ivogue-outubro', 'rock-in-rio'].includes(name);
    const sizes = cover ? '(max-width: 720px) 87vw, (max-width: 1320px) 35vw, 434px'
      : name === 'maria-unboxing' ? '(max-width: 760px) 340px, 350px'
      : name === 'mavibag' && !tag.includes('polaroid') ? '(max-width: 720px) 90vw, 560px'
      : '(max-width: 720px) 44vw, 240px';
    tag = tag.replace(/\s(?:src|srcset|sizes|width|height|data-full-src)="[^"]*"/g, '');
    const responsive = variants.length > 1
      ? ` srcset="${variants.map(v => `${v.url} ${v.width}w`).join(', ')}" sizes="${sizes}"` : '';
    const img = tag.replace('<img', `<img src="${fallback.url}" width="${asset.width}" height="${asset.height}"${responsive}${cover ? ` data-full-src="${variants.at(-1).url}"` : ''}`);
    return asset.avifVariants?.length
      ? `<picture data-optimized><source type="image/avif" srcset="${asset.avifVariants.map(v => `${v.url} ${v.width}w`).join(', ')}" sizes="${sizes}" />${img}</picture>`
      : img;
  });
}
const icon = manifest['icone-rosa'].variants[0].url;
html = html.replace(/<link rel="icon"[^>]+>/, `<link rel="icon" href="${icon}" type="image/webp" />`);
const poster = manifest['maria-unboxing'];
html = html.replace(/(<video class="hero__video"[^>]*poster=")[^"]+/, `$1${poster.variants[1].url}`);
const preloadVariants = poster.avifVariants.length ? poster.avifVariants : poster.variants;
const preload = `<link rel="preload" as="image" type="image/${poster.avifVariants.length ? 'avif' : 'webp'}" href="${preloadVariants[1].url}" imagesrcset="${preloadVariants.map(v => `${v.url} ${v.width}w`).join(', ')}" imagesizes="(max-width: 760px) 340px, 350px" fetchpriority="high" />`;
html = html.replace(/<link rel="preload" as="image"[^>]+>/, preload);
await writeFile('index.html', html);
