const categories = {
  ACSS: 'Acessórios',
  IPH: 'iPhone',
  WATCH: 'Apple Watch',
  IPAD: 'iPad',
  MAC: 'MacBook',
};

const conditions = {
  lacrado: 'Lacrado',
  novo: 'Novo',
  seminovo: 'Seminovo',
  cpo: 'CPO',
};

const sizes = /^(\d+\s*(?:GB|TB))\s*\/\s*(\d+\s*(?:GB|TB))$/i;
const apple = /\b(apple|iphone|ipad|macbook|imac|airpods|airtag|mac mini|mac studio)\b/i;
const android = /\b(android|samsung|galaxy|xiaomi|redmi|poco|motorola|moto|pixel|realme|oneplus|oppo|honor|huawei)\b/i;
const collator = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });

const colors = {
  'alpine green': '#52684d', azul: '#587fae', black: '#222328', 'black titanium': '#353537',
  blue: '#6c8db2', 'blue titanium': '#526075', blush: '#e9a6ac', branco: '#f5f4ef',
  burgundy: '#722d47', citrus: '#d9d764', 'cloud white': '#f6f4f0', 'cosmic orange': '#ed733c',
  'dark bronze': '#735746', 'deep blue': '#253a59', 'deep purple': '#504259', 'desert titanium': '#d0aa92',
  glacier: '#b6dce8', gold: '#dcb887', graphite: '#4b4b50', green: '#72a687', indigo: '#555a97',
  'jet black': '#131418', laranja: '#e88b43', lavender: '#c0afe0', 'light gold': '#e6ceaa',
  lilas: '#c1a5dc', midnight: '#263140', 'midnight green': '#48574e', 'mist blue': '#bccfe6',
  'natural titanium': '#a8a39a', 'night sky': '#2d384d', orange: '#e88b43', 'pacific blue': '#36697e',
  pink: '#efa6bb', preto: '#222328', purple: '#9c80bf', red: '#c73b4d', 'rose gold': '#d7a19a',
  roxo: '#9c80bf', sage: '#a0b39c', 'sierra blue': '#91afcb', silver: '#c5c9ca',
  'sky blue': '#adcadf', 'space black': '#29292c', 'space gray': '#737377', 'star white': '#f8f4eb',
  starlight: '#e9dfce', teal: '#60a59d', ultramarine: '#5664bc', white: '#f5f4ef',
  'white titanium': '#e8e5df', yellow: '#f0d36e',
};

const supplierImageHosts = new Set(['pps.whatsapp.net', 'ekldegvacrfqcmxaavzm.supabase.co']);

export function normalize(value = '') {
  return String(value ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .toLowerCase().replace(/(\d)\s+(gb|tb)\b/g, '$1$2')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\bsemi novo\b/g, 'seminovo').trim();
}

export function colorSwatch(color) {
  const key = normalize(color);
  return Object.hasOwn(colors, key) ? colors[key] : undefined;
}

function supplierImage(value) {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && supplierImageHosts.has(url.host) && !url.username && !url.password) {
      return url.href;
    }
  } catch { /* O fornecedor pode não ter foto. */ }
  return undefined;
}

export function prepareListing(row) {
  const rawStorage = row.storage?.trim() ?? '';
  const parts = rawStorage.match(sizes);
  const storage = (parts?.[2] ?? rawStorage).replace(/\s/g, '').toUpperCase();
  const ram = parts?.[1].replace(/\s/g, '').toUpperCase() ?? '';
  const region = row.region?.trim() ?? '';
  const color = row.color?.trim() ?? '';
  const categoryCode = row.products?.category ?? '';
  const category = categories[categoryCode] ?? categoryCode;
  const name = row.products?.name?.trim() ?? '';
  const separateConfiguration = categoryCode === 'MAC' || /\bmacbook\b/i.test(name) || Boolean(ram);
  const supplier = row.suppliers?.name ?? '';
  const location = row.suppliers?.location?.trim() ?? '';
  const city = row.suppliers?.city?.trim() ?? '';
  const conditionCode = normalize(row.condition).replaceAll(' ', '');
  const condition = conditions[conditionCode] ?? row.condition ?? '';
  const namedUsed = /\bsemi ?novo\b/.test(normalize(name));
  const used = namedUsed || ['seminovo', 'usado'].includes(conditionCode);
  const price = row.wholesale_price == null || row.wholesale_price === ''
    ? null : Number(row.wholesale_price);

  return {
    id: row.id, name, storage, ram, region, color, category, supplier,
    productKey: JSON.stringify([
      categoryCode, name.normalize('NFC').toLowerCase(), used,
      ...(separateConfiguration ? [ram, storage] : []),
    ]),
    productLabel: used && !namedUsed ? `${name} SEMI-NOVO` : name,
    separateConfiguration,
    supplierId: String(row.supplier_id ?? supplier), location, city, condition,
    supplierPhoto: supplierImage(row.suppliers?.profile_pic_url),
    price: Number.isFinite(price) ? price : null,
    time: row.listed_at,
    active: row.suppliers?.is_active === true,
    used,
    kind: categories[categoryCode] && categoryCode !== 'ACSS' || apple.test(name)
      ? 'apple' : android.test(name) ? 'android' : 'other',
  };
}

export const filterFields = [
  ['category', 'Categoria', 'Todas as categorias'],
  ['storage', 'Capacidade', 'Qualquer capacidade'],
  ['ram', 'Memória RAM', 'Qualquer RAM'],
  ['color', 'Cor', 'Todas as cores'],
  ['supplier', 'Fornecedor', 'Todos os fornecedores'],
  ['location', 'Localização', 'Qualquer local'],
  ['region', 'Região', 'Todas as regiões'],
  ['condition', 'Condição', 'Todas as condições'],
];

export function productOptions(rows) {
  const products = new Map();
  for (const row of rows) {
    if (row.name && !products.has(row.productKey)) {
      const configuration = row.separateConfiguration
        ? [row.ram ? `${row.ram} RAM` : 'RAM não informada', row.storage ? `${row.storage} SSD` : 'SSD não informado'].join(' / ')
        : '';
      const label = configuration ? `${row.productLabel} · ${configuration}` : row.productLabel;
      products.set(row.productKey, {
        key: row.productKey,
        label,
        title: row.productLabel,
        category: row.used ? [row.category, 'Seminovo'].filter(Boolean).join(' · ') : row.category,
        configuration,
        search: normalize(label),
      });
    }
  }
  return [...products.values()].sort((a, b) => collator.compare(a.label, b.label));
}

export function matchProducts(options, input) {
  const ignored = new Set(['com', 'de', 'ram', 'ssd', 'memoria']);
  const terms = normalize(input).split(' ').filter(term => term && !ignored.has(term));
  if (!terms.length) return options.slice(0, 20);
  return options.filter(option => terms.every(term => /^\d+(gb|tb)$/.test(term)
    ? option.search.split(' ').includes(term)
    : option.search.includes(term)));
}

function locations(row) {
  return [row.location, row.city].filter(Boolean);
}

export function filterOptions(rows) {
  return Object.fromEntries(filterFields.map(([field]) => {
    const values = field === 'location' ? rows.flatMap(locations) : rows.map(row => row[field]);
    const unique = new Map();
    for (const value of values.filter(Boolean)) unique.set(normalize(value), value);
    const options = [...unique.values()];
    if (field === 'storage' || field === 'ram') {
      const toGB = value => parseFloat(value) * (value.endsWith('TB') ? 1024 : 1);
      options.sort((a, b) => toGB(a) - toGB(b) || collator.compare(a, b));
    } else {
      options.sort(collator.compare);
    }
    return [field, options];
  }));
}

export function filterListings(rows, { productKey, segment, activeOnly, fields = {} }) {
  const selected = Object.entries(fields).map(([field, value]) => [field, normalize(value)]);
  return rows.filter(row =>
    (segment === 'used' ? row.used : !segment || row.kind === segment)
    && (!activeOnly || row.active)
    && (!productKey || row.productKey === productKey)
    && selected.every(([field, value]) => field === 'location'
      ? locations(row).some(location => normalize(location) === value)
      : normalize(row[field]) === value),
  );
}

export function sortByPrice(rows, direction = 'asc') {
  return [...rows].sort((a, b) => {
    if (a.price === null) return b.price === null ? 0 : 1;
    if (b.price === null) return -1;
    return direction === 'asc' ? a.price - b.price : b.price - a.price;
  });
}

export function cheapestByColor(rows) {
  const cheapest = new Map();
  for (const row of rows) {
    if (!row.color || row.price === null) continue;
    const key = normalize(row.color);
    const previous = cheapest.get(key);
    if (!previous || row.price < previous.price) cheapest.set(key, row);
  }
  return sortByPrice([...cheapest.values()]);
}
