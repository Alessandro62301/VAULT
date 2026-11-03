import sharp from 'sharp';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Deterministic encoding/resizing only. Keep the supplied originals unchanged.
const assets = [
  ['ivogue-outubro', 'colecao/ivogue-outubro.jpg', [480, 640, 960, 1200], 84],
  ['rock-in-rio', 'colecao/rock-in-rio.jpg', [480, 640, 960, 1200], 84],
  ['maria-avatar', 'colecao/maria-macbook.png', [128], 82],
  ['maria-unboxing', 'hero/maria-unboxing-poster.jpg', [360, 640, 720], 82],
  ['mavibag', 'quem-somos/mavibag.jpg', [400, 700, 900], 82],
  ['maria-odontologia', 'colecao/maria-odontologia.jpg', [400, 700], 82],
  ['maria-junior', 'colecao/maria-junior.jpg', [400, 700], 82],
  ['odontologia-comunidade', 'colecao/odontologia-comunidade.jpg', [400, 700], 82],
  ['sacola-rosa', 'colecao/sacola-rosa-origens.jpg', [400, 700], 82],
  ['icone-rosa', 'colecao/icone-rosa.png', [64], 90],
];
await mkdir('public/optimized', { recursive: true });
const manifest = {};
for (const [name, source, widths, quality] of assets) {
  const original = `public/${source}`;
  const meta = await sharp(original).metadata();
  const variants = [];
  const avifVariants = [];
  for (const width of widths) {
    const { data, info } = await sharp(original).rotate().resize({ width, withoutEnlargement: true })
      .webp({ quality, effort: 6 }).toBuffer({ resolveWithObject: true });
    const hash = createHash('sha256').update(data).digest('hex').slice(0, 10);
    const url = `/optimized/${name}-${info.width}-${hash}.webp`;
    await writeFile(`public${url}`, data);
    variants.push({ url, width: info.width, height: info.height, bytes: data.length });
    if (['ivogue-outubro', 'rock-in-rio', 'maria-unboxing'].includes(name)) {
      const avif = await sharp(original).rotate().resize({ width, withoutEnlargement: true })
        .avif({ quality: 55, effort: 5 }).toBuffer({ resolveWithObject: true });
      const avifHash = createHash('sha256').update(avif.data).digest('hex').slice(0, 10);
      const avifUrl = `/optimized/${name}-${avif.info.width}-${avifHash}.avif`;
      await writeFile(`public${avifUrl}`, avif.data);
      avifVariants.push({ url: avifUrl, width: avif.info.width, height: avif.info.height, bytes: avif.data.length });
    }
  }
  manifest[name] = { source: `/${source}`, width: meta.width, height: meta.height, originalBytes: (await stat(original)).size, variants, avifVariants };
}
await writeFile('_briefing/performance-images.json', `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(Object.fromEntries(Object.entries(manifest).map(([key, value]) => [key, {
  original: value.originalBytes, variants: value.variants.map(v => ({ width: v.width, bytes: v.bytes })),
}])) , null, 2));
