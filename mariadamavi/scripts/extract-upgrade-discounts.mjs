import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename, resolve, join } from 'node:path';

const [inputPath, evidencePath, outputPath] = process.argv.slice(2);
if (!inputPath || !evidencePath || !outputPath) throw new Error('Uso: node scripts/extract-upgrade-discounts.mjs texto.txt colunas-verificadas.json diretorio-saida');

const columns = [
  ['light', 'Marcas leves'], ['moderate', 'Marcas moderadas'], ['battery', 'Bateria (saúde baixa)'],
  ['screen', 'Troca de tela'], ['back', 'Traseira'], ['faceid', 'Face ID'],
  ['charging', 'Doc de carga'], ['camera', 'Câmera traseira'],
  ['part-camera', 'Notif. peça - câmera'], ['part-battery', 'Notif. peça - bateria'], ['part-screen', 'Notif. peça - tela'],
];
const keysByLabel = new Map(columns.map(([key, label]) => [label, key]));
const source = await readFile(inputPath, 'utf8');
const evidence = JSON.parse(await readFile(evidencePath, 'utf8'));
const evidenceByModel = new Map(evidence.models.map(item => [item.model, item]));
const lines = source.replace(/^\uFEFF/, '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
const header = lines.slice(0, lines.indexOf('▾')).filter(line => line !== 'i');
const expectedHeader = ['Modelo', 'Na troca', ...columns.map(([, label]) => label)];
if (JSON.stringify(header) !== JSON.stringify(expectedHeader)) throw new Error('As colunas do texto não coincidem com o cabeçalho esperado.');

const rows = [];
const groupCounts = [];
let group;
let current;
for (const [index, line] of lines.entries()) {
  const match = line.match(/^(.+?)\s+(\d+)(GB|TB)$/);
  if (match) {
    if (current) throw new Error(`Linha incompleta antes de ${line}`);
    current = { sourceModel: line, model: `iPhone ${match[1]}`, capacity: `${match[2]}${match[3]}`, storageGb: Number(match[2]) * (match[3] === 'TB' ? 1024 : 1), group, values: [], line: index + 1 };
    rows.push(current);
  } else if (/^iPhone\s+/.test(line)) group = line;
  else if (/^·\s+\d+\s+modelos$/.test(line)) groupCounts.push({ group, expected: Number(line.match(/\d+/)[0]) });
  else if (current && /^\d+$/.test(line)) {
    const value = Number(line);
    if (!Number.isSafeInteger(value * 100)) throw new Error(`Valor inválido em ${current.sourceModel}`);
    current.values.push(value * 100);
  } else if (line === '×') current = null;
  else if (current) throw new Error(`Conteúdo inesperado em ${current.sourceModel}: ${line}`);
}
if (current) throw new Error('O último modelo está incompleto.');
if (new Set(rows.map(row => row.sourceModel)).size !== rows.length) throw new Error('Há modelos/capacidades duplicados.');
for (const group of groupCounts) {
  group.actual = rows.filter(row => row.group === group.group).length;
  if (group.actual !== group.expected) throw new Error(`Contagem incorreta em ${group.group}`);
}
if (groupCounts.reduce((total, group) => total + group.expected, 0) !== rows.length) throw new Error('Os totais dos grupos não coincidem.');

const publicValueDifferences = [];
let alignedUsingEvidence = 0;
const models = rows.map(row => {
  const [baseCents, ...amounts] = row.values;
  if (!Number.isSafeInteger(baseCents)) throw new Error(`Valor de troca ausente: ${row.model}`);
  let fields = columns.map(([key]) => key);
  if (amounts.length !== columns.length) {
    const confirmed = evidenceByModel.get(`${row.model} ${row.capacity}`);
    if (!confirmed) throw new Error(`Confirme as colunas incompletas de ${row.sourceModel}`);
    const observed = confirmed.labels.map(text => {
      const match = text.match(/^(.*?)\s*-\s*R\$\s*([\d.,]+)/);
      const key = match && keysByLabel.get(match[1].trim());
      if (!key) throw new Error(`Coluna desconhecida na referência: ${text}`);
      return { key, cents: Number(match[2].replace(/\D/g, '')) };
    });
    if (observed.length !== amounts.length) throw new Error(`Quantidade de valores incompatível em ${row.sourceModel}`);
    fields = observed.map(item => item.key);
    observed.forEach((item, index) => {
      if (item.cents !== amounts[index]) publicValueDifferences.push({ model: row.model, capacity: row.capacity, field: item.key, providedCents: amounts[index], publicCents: item.cents });
    });
    alignedUsingEvidence++;
  }
  const deductionsCents = Object.fromEntries(columns.map(([key]) => [key, null]));
  fields.forEach((key, index) => { deductionsCents[key] = amounts[index]; });
  return {
    modelId: row.model.toLowerCase().replace(/\s+/g, '-'), model: row.model, family: row.group,
    capacity: row.capacity, storageGb: row.storageGb, baseCents, deductionsCents,
    missingFields: columns.filter(([key]) => deductionsCents[key] === null).map(([key]) => key),
  };
});

const summary = {
  configurations: models.length,
  distinctModels: new Set(models.map(model => model.modelId)).size,
  discountCategories: columns.length,
  extractedDiscountValues: models.reduce((sum, model) => sum + Object.values(model.deductionsCents).filter(value => value !== null).length, 0),
  missingValues: models.reduce((sum, model) => sum + model.missingFields.length, 0),
  incompleteConfigurations: alignedUsingEvidence,
  completeConfigurations: models.length - alignedUsingEvidence,
  groupCounts, publicValueDifferences,
};
const metadata = {
  currency: 'BRL', monetaryUnit: 'centavos', extractedAt: '2026-11-04',
  sourceFile: basename(inputPath), sourceSha256: createHash('sha256').update(source).digest('hex'),
  missingValueMeaning: 'null = campo sem valor informado no texto; nunca interpretado como desconto zero.',
  fieldAlignment: 'Nas linhas incompletas, os nomes e a ordem foram conferidos na interface pública. Os valores numéricos continuam sendo os fornecidos no arquivo colado.',
};

const out = resolve(outputPath);
await mkdir(out, { recursive: true });
await writeFile(join(out, 'descontos-por-modelo.json'), JSON.stringify({ metadata, columns: Object.fromEntries(columns), summary, models }, null, 2) + '\n');
const escapeCsv = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
const priceCsv = cents => cents === null ? '' : (cents / 100).toFixed(2).replace('.', ',');
const headerCsv = ['Modelo', 'Memória', 'Na troca (R$)', ...columns.map(([, label]) => `${label} (R$)`), 'Campos sem valor informado'];
const csvRows = models.map(model => [model.model, model.capacity, priceCsv(model.baseCents), ...columns.map(([key]) => priceCsv(model.deductionsCents[key])), model.missingFields.map(key => Object.fromEntries(columns)[key]).join(' | ')]);
await writeFile(join(out, 'descontos-por-modelo.csv'), '\uFEFF' + [headerCsv, ...csvRows].map(row => row.map(escapeCsv).join(';')).join('\r\n') + '\r\n');
await writeFile(join(out, 'validacao.json'), JSON.stringify(summary, null, 2) + '\n');
await writeFile(join(out, 'LEIA-ME.txt'), [
  'Descontos de iPhone por modelo e memória — 04/11/2026', '',
  `${summary.configurations} configurações; ${summary.distinctModels} modelos; ${summary.extractedDiscountValues} valores de desconto extraídos.`,
  'CSV: valores em reais, separador ponto e vírgula, vírgula decimal e codificação UTF-8 com BOM para Excel.',
  'JSON: valores inteiros em centavos (ex.: 17800 = R$ 178,00). Na troca é o valor-base, não um desconto.',
  `${summary.missingValues} campos não vieram informados. Estão vazios no CSV e null no JSON; não significam zero.`,
  `${summary.incompleteConfigurations} linhas tinham menos colunas no texto. A posição dos campos foi conferida na interface pública do QuantoPega, mantendo os valores fornecidos no texto.`,
  'iPhone 11: notificação de bateria e tela; XS, XR e SE: notificação de bateria; X e 8 Plus: sem valores de notificação no texto.',
  'A memória foi preservada porque os descontos podem mudar entre capacidades do mesmo modelo.',
  'A extração não modifica a tabela do simulador automaticamente.',
].join('\r\n') + '\r\n');
console.log(JSON.stringify({ output: out, ...summary, samples: models.filter(model => ['iPhone 13', 'iPhone 17 Pro'].includes(model.model) && model.storageGb === (model.model === 'iPhone 13' ? 128 : 256)) }, null, 2));
