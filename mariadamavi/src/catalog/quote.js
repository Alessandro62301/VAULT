export const DEFAULT_FACTORS = { x12: 0.09528, x18: 0.06717 };
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });
export function money(cents) { return brl.format(cents / 100).replace(/\u00a0/g, ' '); }
export function parseMoney(value, { allowZero = false } = {}) {
  let text = String(value ?? '').trim().replace(/R\$|\s/g, '');
  if (!text) return null;
  if (text.includes(',')) text = text.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(text)) text = text.replace(/\./g, '');
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
  const cents = Math.round(Number(text) * 100);
  return Number.isSafeInteger(cents) && (allowZero ? cents >= 0 : cents > 0) && cents <= 100000000 ? cents : null;
}
export function calculateSale(costCents, profitCents, logisticsCents = 0, discountCents = 0) {
  if (!Number.isSafeInteger(costCents) || costCents <= 0) throw new Error('Informe um custo válido.');
  if (!Number.isSafeInteger(profitCents) || profitCents < 0) throw new Error('Informe um lucro válido em reais.');
  if (!Number.isSafeInteger(logisticsCents) || logisticsCents < 0) throw new Error('Informe um custo de entrega/logística válido.');
  if (!Number.isSafeInteger(discountCents) || discountCents < 0) throw new Error('Informe um desconto válido em reais.');
  const priceCents = costCents + logisticsCents + profitCents - discountCents;
  if (priceCents <= 0) throw new Error('O desconto precisa ser menor que o preço de venda.');
  if (!Number.isSafeInteger(priceCents) || priceCents > 100000000) throw new Error('Confira os valores da venda.');
  return priceCents;
}
export function saleBreakdown(item) {
  const costCents = parseMoney(item.cost);
  const profitCents = parseMoney(item.profit, { allowZero: true });
  const logisticsCents = parseMoney(item.logistics ?? '0', { allowZero: true });
  const discountCents = parseMoney(item.discount ?? '0', { allowZero: true });
  const priceCents = calculateSale(costCents, profitCents, logisticsCents, discountCents);
  return { priceCents, costCents, profitCents, logisticsCents, discountCents,
    totalCostCents: costCents + logisticsCents, netProfitCents: profitCents - discountCents };
}
export function saleQuoteItem(item) {
  const name = clean(item.name);
  if (!name) throw new Error('Informe o produto.');
  const category = /^iphone/i.test(name) ? 'iPhones' : /^macbook/i.test(name) ? 'MacBooks'
    : /^ipad/i.test(name) ? 'iPads' : /^apple watch|^watch/i.test(name) ? 'Apple Watch'
    : /^airpods/i.test(name) ? 'AirPods' : /^mac mini/i.test(name) ? 'Mac mini'
    : /^mac studio/i.test(name) ? 'Mac Studio' : /^imac/i.test(name) ? 'iMac' : 'Acessórios';
  const { priceCents, discountCents } = saleBreakdown(item);
  return { product: { product: name, category, configuration: 'Padrão' }, color: item.color || '', priceCents, discountCents };
}
export function installment(priceCents, factor) {
  if (!Number.isSafeInteger(priceCents) || priceCents <= 0 || !Number.isFinite(factor) || factor <= 0 || factor > 1) return null;
  return Math.round(priceCents * factor);
}
function clean(value) { return String(value ?? '').replace(/[\r\n*_~`]/g, ' ').replace(/\s+/g, ' ').trim(); }
export function configurationLabel(product) {
  const config = clean(product.configuration);
  if (!['MacBooks', 'Mac mini', 'Mac Studio', 'iMac'].includes(product.category)) return config === '0' ? 'Padrão' : config;
  // Variant labels take precedence over inherited model-level RAM/storage.
  const pair = config.match(/(\d+)\s*GB\s*(?:RAM)?\s*[|/]\s*(\d+(?:\.\d+)?)\s*(TB|GB)?\s*(?:SSD)?/i);
  if (pair) return `${pair[1]}GB/${pair[2]}${(pair[3] || 'GB').toUpperCase()}`;
  const ram = clean(product.ram).replace(/\s*RAM/i, '');
  const storage = (config !== 'Padrão' ? config : clean(product.storage)).replace(/\s*SSD/i, '').trim();
  return ram && storage ? `${ram}/${storage}` : config;
}
export function productTitle(product, color = '') {
  const name = clean(product.product).replace(/ Lacrado$/i, '');
  const config = configurationLabel(product);
  let title = name;
  if (['MacBooks', 'Mac mini', 'Mac Studio', 'iMac'].includes(product.category)) {
    const details = config !== 'Padrão' ? config : '';
    if (details && !name.includes(details)) title += ` | ${details}`;
  } else if (config && config !== 'Padrão' && !name.toLowerCase().includes(config.toLowerCase())) title += ` ${config}`;
  if (product.condition === 'Seminovo') title += ' · Seminovo';
  if (clean(color)) title += ` | ${clean(color)}`;
  return title;
}
export function emojiFor(category) {
  if (category === 'iPhones') return '📱';
  if (category === 'MacBooks') return '💻';
  if (['Mac mini', 'Mac Studio', 'iMac'].includes(category)) return '🖥️';
  if (category === 'iPads') return '📲';
  if (category === 'Apple Watch') return '⌚';
  if (category === 'AirPods') return '🎧';
  return '🔌';
}
export function buildQuote(items, factors = DEFAULT_FACTORS, options = { x12: true, x18: true }) {
  if (!items.length) throw new Error('Adicione pelo menos um produto ao orçamento.');
  return items.map(item => {
    if (!Number.isSafeInteger(item.priceCents) || item.priceCents <= 0) throw new Error(`Informe o valor à vista de ${item.product.product}.`);
    const lines = [`${emojiFor(item.product.category)} *${productTitle(item.product, item.color)}*`];
    if (Number.isSafeInteger(item.discountCents) && item.discountCents > 0) {
      lines.push(`🏷️ *${money(item.discountCents).replace(/,00$/, '')} de desconto*`);
    }
    lines.push('', `💰 *${money(item.priceCents).replace(/,00$/, '')} à vista*`);
    for (const key of ['x12', 'x18']) if (options[key]) {
      const cents = item[key] ?? installment(item.priceCents, factors[key]);
      if (!Number.isSafeInteger(cents) || cents <= 0) throw new Error(`Confira o parcelamento ${key.slice(1)}x de ${item.product.product}.`);
      lines.push(`💳 ${key.slice(1)}x de *${money(cents)}*`);
    }
    return lines.join('\n');
  }).join('\n━━━━━━━━━━━━━━\n');
}
