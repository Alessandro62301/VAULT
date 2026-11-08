import '../styles/fonts.css';
import './style.css';
import catalog from './catalog.json';
import { createProductPicker } from './product-picker.js';
import { defaultProfit } from './profit-rules.js';
import { DEFAULT_FACTORS, buildQuote, installment, money, parseMoney, productTitle, saleBreakdown, saleQuoteItem } from './quote.js';

const $ = selector => document.querySelector(selector);
const KEY = 'mavi-sales-calculator-v1';
const newItem = () => ({ id: crypto.randomUUID(), name: '', color: '', cost: '', profit: '0,00', logistics: '0,00', discount: '0,00' });
let items = [newItem()];
let factors = { ...DEFAULT_FACTORS };
let options = { x12: true, x18: true };
let toastTimer;
const views = new Map();
const pickers = [];
const suggestions = [...new Map(catalog.rows.map(p => [productTitle(p), { name: productTitle(p), detail: `${p.category} · ${p.condition.toLowerCase()}` }])).values()];

function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function notify(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message; $('#toast').hidden = false;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 3500);
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ items, factors, options }));
    $('#save-state').textContent = 'Rascunho salvo neste navegador.';
  } catch { $('#save-state').textContent = 'Armazenamento indisponível. Mantenha esta aba aberta.'; }
}
function load() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!stored) return;
    if (Array.isArray(stored.items)) {
      items = stored.items.filter(item => item && typeof item.name === 'string').slice(0, 100).map(item => ({
        id: crypto.randomUUID(), name: item.name.slice(0, 180), color: String(item.color || '').slice(0, 100),
        cost: String(item.cost ?? '').slice(0, 30), profit: String(item.profit ?? '').slice(0, 30),
        logistics: String(item.logistics ?? '0,00').slice(0, 30), discount: String(item.discount ?? '0,00').slice(0, 30)
      }));
      if (!items.length) items = [newItem()];
    }
    for (const key of ['x12', 'x18']) {
      if (stored.factors?.[key] === null || Number.isFinite(stored.factors?.[key]) && stored.factors[key] > 0 && stored.factors[key] <= 1) factors[key] = stored.factors[key];
      if (typeof stored.options?.[key] === 'boolean') options[key] = stored.options[key];
    }
  } catch { $('#save-state').textContent = 'Não foi possível recuperar o rascunho. Comece uma nova venda.'; }
}
function field(item, key, text, placeholder, { decimal = false, list = false } = {}) {
  const label = el('label', text);
  const input = el('input');
  input.type = 'text'; input.value = item[key]; input.placeholder = placeholder;
  input.maxLength = decimal ? 30 : key === 'name' ? 180 : 100;
  if (decimal) input.inputMode = 'decimal';
  input.autocomplete = 'off';
  input.addEventListener('input', () => {
    item[key] = input.value;
    const invalid = key === 'cost' ? Boolean(input.value.trim()) && parseMoney(input.value) === null
      : ['profit', 'logistics', 'discount'].includes(key) ? parseMoney(input.value, { allowZero: true }) === null : key === 'name' ? !input.value.trim() : false;
    input.setAttribute('aria-invalid', String(invalid));
    save(); update();
  });
  label.append(input);
  if (list) {
    let previousProduct = item.name;
    const applyPreset = () => {
      if (item.name === previousProduct) return;
      previousProduct = item.name;
      item.profit = (defaultProfit(item.name) / 100).toFixed(2).replace('.', ',');
      const profitInput = views.get(item.id)?.profitInput;
      if (profitInput) { profitInput.value = item.profit; profitInput.removeAttribute('aria-invalid'); }
      save(); update();
    };
    input.addEventListener('change', applyPreset);
    pickers.push(createProductPicker(input, suggestions, applyPreset));
  }
  return label;
}
function renderItems(focusLast = false) {
  pickers.splice(0).forEach(picker => picker.destroy());
  views.clear();
  $('#sale-items').replaceChildren(...items.map((item, index) => {
    const card = el('article', undefined, 'sale-item');
    const heading = el('div', undefined, 'sale-item-heading');
    const title = el('h3', `Produto ${String(index + 1).padStart(2, '0')}`);
    const remove = el('button', 'Remover', 'text-button'); remove.type = 'button';
    remove.setAttribute('aria-label', `Remover produto ${index + 1}`);
    remove.addEventListener('click', () => {
      items = items.filter(x => x !== item);
      if (!items.length) items = [newItem()];
      save(); renderItems();
    });
    heading.append(title, remove);
    const productFields = el('div', undefined, 'sale-product-fields');
    productFields.append(field(item, 'name', 'Produto', 'Ex.: iPhone 18 Pro 256GB', { list: true }), field(item, 'color', 'Cor (opcional)', 'Ex.: Preto'));
    const values = el('div', undefined, 'sale-value-fields');
    const cost = field(item, 'cost', 'Custo (R$)', 'Ex.: 7.900,00', { decimal: true });
    cost.append(el('small', 'Valor de compra do produto'));
    const profit = field(item, 'profit', 'Lucro desejado (R$)', 'Ex.: 1.000,00', { decimal: true });
    profit.append(el('small', 'Padrão do produto · você pode editar'));
    const logistics = field(item, 'logistics', 'Entrega / logística (R$)', '0,00', { decimal: true });
    logistics.append(el('small', 'Somado ao custo do produto'));
    const discount = field(item, 'discount', 'Desconto (R$)', '0,00', { decimal: true });
    discount.append(el('small', 'Reduz o preço e o lucro final'));
    values.classList.add('sale-value-fields--four');
    values.append(cost, logistics, profit, discount);
    const result = el('div', undefined, 'sale-result');
    const cash = el('div'); cash.append(el('span', 'Preço de venda à vista'));
    const cashValue = el('strong', '—'); cash.append(cashValue);
    const installments = el('p'); result.append(cash, installments);
    const breakdown = el('div', undefined, 'sale-breakdown');
    const costSummary = el('span'); const profitSummary = el('strong');
    breakdown.append(costSummary, profitSummary);
    const error = el('p', '', 'error-message'); error.hidden = true;
    views.set(item.id, { cashValue, installments, error, costSummary, profitSummary, profitInput: profit.querySelector('input') });
    card.append(heading, productFields, values, result, breakdown, error);
    return card;
  }));
  update();
  if (focusLast) $('#sale-items').lastElementChild.querySelector('input').focus();
}
function update() {
  const hasContent = item => [item.name, item.color, item.cost].some(value => value.trim()) || ['profit','logistics','discount'].some(key => item[key].trim() !== '0,00');
  let total = 0;
  let totalProfit = 0;
  let totalLogistics = 0;
  let totalDiscount = 0;
  let complete = 0;
  for (const item of items) {
    const view = views.get(item.id);
    try {
      const result = saleBreakdown(item);
      const price = result.priceCents;
      view.cashValue.textContent = money(price);
      view.installments.textContent = ['x12', 'x18'].filter(key => options[key]).map(key => {
        const amount = installment(price, factors[key]);
        return amount ? `${key.slice(1)}x de ${money(amount)}` : `${key.slice(1)}x: confira o coeficiente`;
      }).join(' · ');
      view.error.hidden = true;
      view.costSummary.textContent = `Custo com logística: ${money(result.totalCostCents)}`;
      view.profitSummary.textContent = `${result.netProfitCents < 0 ? 'Prejuízo' : 'Lucro após desconto'}: ${money(result.netProfitCents)}`;
      view.profitSummary.classList.toggle('is-loss', result.netProfitCents < 0);
      if (item.name.trim()) { total += price; totalProfit += result.netProfitCents; totalLogistics += result.logisticsCents; totalDiscount += result.discountCents; complete++; }
    } catch (error) {
      view.cashValue.textContent = '—'; view.installments.textContent = 'Preencha custo e lucro para calcular.';
      view.error.hidden = !hasContent(item); view.error.textContent = error.message;
      view.costSummary.textContent = ''; view.profitSummary.textContent = '';
    }
  }
  $('#sale-count').textContent = items.length;
  $('#total-sale').textContent = complete ? money(total) : '—';
  $('#total-profit').textContent = complete ? money(totalProfit) : '—';
  $('#total-profit').classList.toggle('is-loss', totalProfit < 0);
  $('#total-logistics').textContent = complete ? money(totalLogistics) : '—';
  $('#total-discount').textContent = complete ? money(totalDiscount) : '—';
  $('#totals-note').textContent = complete === items.length ? `${complete} ${complete === 1 ? 'produto calculado' : 'produtos calculados'}` : 'Preencha todos os produtos para concluir.';
  let message = '';
  let error = '';
  try { message = buildQuote(items.map(saleQuoteItem), factors, options); }
  catch (e) { if (items.some(hasContent)) error = e.message; }
  $('#quote-preview').value = message;
  $('#quote-preview').rows = Math.max(8, Math.min(22, message.split('\n').length + 1));
  $('#quote-error').textContent = error; $('#quote-error').hidden = !error;
  $('#copy-quote').disabled = !message;
}
load();
for (const key of ['x12', 'x18']) {
  const input = $(`#factor${key.slice(1)}`);
  input.value = factors[key] === null ? '' : String(factors[key]).replace('.', ',');
  input.addEventListener('input', () => {
    const value = Number(input.value.trim().replace(',', '.'));
    factors[key] = Number.isFinite(value) && value > 0 && value <= 1 ? value : null;
    input.setAttribute('aria-invalid', String(factors[key] === null));
    save(); update();
  });
  const checkbox = $(`#include${key.slice(1)}`); checkbox.checked = options[key];
  checkbox.addEventListener('change', () => { options[key] = checkbox.checked; save(); update(); });
}
$('#add-product').addEventListener('click', () => { items.push(newItem()); save(); renderItems(true); });
$('#new-sale').addEventListener('click', () => { items = [newItem()]; save(); renderItems(true); });
$('#copy-quote').addEventListener('click', async () => {
  let text;
  try { text = buildQuote(items.map(saleQuoteItem), factors, options); }
  catch (error) { notify(error.message); return; }
  try { await navigator.clipboard.writeText(text); notify('Mensagem copiada. É só colar no WhatsApp.'); }
  catch { const preview = $('#quote-preview'); preview.value = text; preview.focus(); preview.select(); notify('Mensagem selecionada. Use Ctrl+C ou Copiar no celular.'); }
});
renderItems();
