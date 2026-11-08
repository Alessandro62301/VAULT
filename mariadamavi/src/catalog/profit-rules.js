// Profit amounts are in cents. These are editable starting values, not margins.
export function defaultProfit(name) {
  const text = String(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const compact = text.replace(/\s/g, '');
  if (/^iphone\b/.test(text)) return /seminovo/.test(text) ? 70000 : 100000;
  if (/^macbook\s+neo\b/.test(text)) return 70000;
  if (/^macbook\s+pro\b/.test(text)) return /\bmax\b/.test(text) ? 250000 : 200000;
  if (/^macbook\s+air\b/.test(text) && /\b(?:13|15)(?:\b|["”])/.test(text)) {
    if (/16(?:gb)?(?:ram)?[|/]512(?:gb)?(?:ssd)?(?:\b|$)/.test(compact)) return 100000;
    if (/24(?:gb)?(?:ram)?[|/]1(?:tb)?(?:ssd)?(?:\b|$)/.test(compact)) return 150000;
  }
  if (/^ipad\s+pro\b/.test(text)) return 200000;
  if (/^ipad\s+air\b/.test(text)) return 120000;
  if (/^ipad\s+11\b/.test(text)) return 50000;
  return 0;
}
