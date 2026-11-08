import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildQuote, calculateSale, DEFAULT_FACTORS, installment, parseMoney, productTitle, saleBreakdown, saleQuoteItem } from '../src/catalog/quote.js';

const phone = { product: 'iPhone 18 Pro', category: 'iPhones', configuration: '256GB', condition: 'Novo lacrado' };
const mac = { product: 'MacBook Air M5 13”', category: 'MacBooks', configuration: '16GB/512GB', ram: '16GB', storage: '512GB', condition: 'Novo lacrado' };

test('venda soma custo e lucro em centavos e permite lucro zero explícito', () => {
  assert.equal(calculateSale(790000, 100000), 890000);
  assert.equal(calculateSale(865050, 0), 865050);
  assert.equal(parseMoney('0,00', { allowZero: true }), 0);
  assert.equal(parseMoney('', { allowZero: true }), null);
  for (const [cost, profit] of [[null,100],[0,100],[100,null],[100,-1],[NaN,100],[100.1,100],[100000000,1]]) assert.throws(() => calculateSale(cost,profit));
});
test('mensagem da calculadora contém só preço de venda, sem custo e lucro', () => {
  const item = saleQuoteItem({ name:'iPhone 18 Pro 256GB', color:'Preto', cost:'7.900,00', profit:'1.000,00' });
  assert.equal(item.priceCents, 890000);
  const text = buildQuote([item]);
  assert.match(text, /📱 \*iPhone 18 Pro 256GB \| Preto\*/);
  assert.match(text, /💰 \*R\$ 8.900 à vista\*/);
  assert.match(text, /12x de \*R\$ 847,99\*/);
  assert.doesNotMatch(text, /7\.900|1\.000|custo|lucro/i);
  assert.throws(() => saleQuoteItem({ name:'', cost:'100',profit:'10' }), /produto/);
  assert.throws(() => saleQuoteItem({ name:'iPhone',cost:'',profit:'10' }), /custo/);
  assert.throws(() => saleQuoteItem({ name:'iPhone',cost:'100',profit:'' }), /lucro/);
});
test('logística compõe custo e desconto reduz preço, parcelas e lucro final', () => {
  const item = { name: 'iPhone 18 Pro 256GB', cost: '7.900,00', logistics: '150,00', profit: '1.000,00', discount: '250,00' };
  const result = saleBreakdown(item);
  assert.equal(result.priceCents, 880000);
  assert.equal(result.totalCostCents, 805000);
  assert.equal(result.netProfitCents, 75000);
  const message = buildQuote([saleQuoteItem(item)]);
  assert.match(message, /R\$ 8.800 à vista/);
  assert.match(message, /12x de \*R\$ 838,46\*/);
  assert.match(message, /📱 \*iPhone 18 Pro 256GB\*\n🏷️ \*R\$ 250 de desconto\*\n\n💰 \*R\$ 8.800 à vista\*/);
  assert.doesNotMatch(message, /7\.900|150,00|logística|custo|lucro/i);
});
test('não mostra linha de desconto quando ele é zero ou ausente', () => {
  for (const discount of [undefined, '0', '0,00']) {
    const message = buildQuote([saleQuoteItem({ name:'iPhone',cost:'100',profit:'20',discount })]);
    assert.doesNotMatch(message, /desconto/);
    assert.match(message, /\*iPhone\*\n\n💰 \*R\$ 120 à vista\*/);
  }
});
test('preserva rascunhos anteriores e mostra prejuízo quando desconto ultrapassa lucro', () => {
  assert.equal(saleBreakdown({ cost:'100', profit:'20' }).priceCents, 12000);
  assert.equal(saleBreakdown({ cost:'100', profit:'20', logistics:'10', discount:'30' }).netProfitCents, -1000);
  for (const values of [[10000,2000,-1,0],[10000,2000,0,null],[10000,2000,0,12000],[10000,2000,0,13000]]) assert.throws(() => calculateSale(...values));
  assert.throws(() => saleBreakdown({ cost:'100', profit:'20', logistics:'' }), /logística/);
  assert.throws(() => saleBreakdown({ cost:'100', profit:'20', discount:'-1' }), /desconto/);
});

test('reproduz orçamento do exemplo com dois produtos e quebras do WhatsApp', () => {
  assert.equal(buildQuote([{ product: phone, priceCents: 890000, color: 'Preto' }, { product: mac, priceCents: 865000 }]),
    '📱 *iPhone 18 Pro 256GB | Preto*\n\n💰 *R$ 8.900 à vista*\n💳 12x de *R$ 847,99*\n💳 18x de *R$ 597,81*\n━━━━━━━━━━━━━━\n💻 *MacBook Air M5 13” | 16GB/512GB*\n\n💰 *R$ 8.650 à vista*\n💳 12x de *R$ 824,17*\n💳 18x de *R$ 581,02*');
});
test('interpreta reais brasileiros, decimais e rejeita valores incompletos ou inválidos', () => {
  for (const value of ['R$ 8.900,00', '8.900', '8900', '8900.00', '8.900,0']) assert.equal(parseMoney(value), 890000);
  for (const value of ['', '-1', '0', 'NaN', '1e3', '8,1,2', '1.234,567', '1000001']) assert.equal(parseMoney(value), null);
  assert.equal(parseMoney('847,99'), 84799);
});
test('não libera orçamento sem preço, sem itens ou com parcelas inválidas', () => {
  assert.throws(() => buildQuote([]), /Adicione/);
  for (const priceCents of [null, 0, -100, NaN, 100.1]) assert.throws(() => buildQuote([{ product: phone, priceCents }]), /valor à vista/);
  assert.throws(() => buildQuote([{ product: phone, priceCents: 10000, x12: 0 }]), /parcelamento/);
  assert.throws(() => buildQuote([{ product: phone, priceCents: 10000 }], { x12: null, x18: .06 }), /parcelamento/);
});
test('usa parcelas manuais e permite desabilitar cada prazo', () => {
  const item = { product: phone, priceCents: 890050, x12: 90000, x18: 65000 };
  const text = buildQuote([item], DEFAULT_FACTORS, { x12: true, x18: false });
  assert.match(text, /R\$ 8.900,50 à vista/);
  assert.match(text, /12x de \*R\$ 900,00\*/);
  assert.doesNotMatch(text, /18x/);
  assert.equal(installment(890000, .09528), 84799);
});
test('preserva condição e impede que cor ou título quebre a mensagem', () => {
  assert.equal(productTitle({ ...phone, condition: 'Seminovo' }, 'Preto\n*promoção*'), 'iPhone 18 Pro 256GB · Seminovo | Preto promoção');
  assert.equal(productTitle({ ...phone, product: 'iPhone 15 Lacrado' }), 'iPhone 15 256GB');
});
test('RAM e SSD da variante substituem campos herdados do modelo no orçamento', () => {
  assert.equal(productTitle({ ...mac, configuration: '16GB|512SSD', storage: '16GB|512SSD' }), 'MacBook Air M5 13” | 16GB/512GB');
  assert.equal(productTitle({ ...mac, configuration: '48GB RAM|1TB SSD', ram: '24GB', storage: '48GB|1TB SSD' }), 'MacBook Air M5 13” | 48GB/1TB');
});
test('catálogo inclui todos os registros extraídos com IDs de configuração únicos', async () => {
  const data = JSON.parse(await readFile(new URL('../src/catalog/catalog.json', import.meta.url), 'utf8'));
  assert.equal(data.rows.length, 217);
  assert.equal(new Set(data.rows.map(p => `${p.jmsId}-${p.variantIndex}`)).size, 217);
  assert.equal(new Set(data.rows.filter(p => p.condition === 'Novo lacrado').map(p => p.jmsId)).size, 84);
  assert.equal(new Set(data.rows.filter(p => p.condition === 'Seminovo').map(p => p.jmsId)).size, 23);
});
