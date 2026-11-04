import '../styles/fonts.css';
import '../styles/tokens.css';
import '../styles/privacy.css';
import '../styles/upgrade.css';
import '../styles/model-picker.css';
import { initTheme } from '../js/theme.js';
import { initMeasurement, trackEvent } from '../js/measurement.js';
import { validateUpgradeConfig, calculateUpgrade, buildUpgradeMessage, formatMoney, formatStorage } from './calculator.js';
import { createModelPicker } from './model-picker.js';

initTheme();
initMeasurement();
document.querySelectorAll('svg').forEach(svg => svg.setAttribute('aria-hidden', 'true'));
const $ = selector => document.querySelector(selector);
const form = $('#upgrade-form');
let config;
const tradePicker = createModelPicker($('#trade-picker'));
const targetPicker = createModelPicker($('#target-picker'));

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function fillCapacities(kind, preferred) {
  const models = kind === 'trade' ? config.tradeIn : config.targets;
  const model = models.find(item => item.id === $(`#${kind}-model`).value);
  const name = kind === 'trade' ? 'tradeCapacity' : 'targetCapacity';
  if (!model) {
    $(`#${kind}-capacities`).replaceChildren();
    return;
  }
  const selected = model.capacities.some(item => item.gb === Number(preferred)) ? Number(preferred) : model.capacities[0].gb;
  $(`#${kind}-capacities`).replaceChildren(...model.capacities.map(item => {
    const label = element('label');
    const input = document.createElement('input');
    input.type = 'radio'; input.name = name; input.value = item.gb; input.checked = item.gb === selected;
    label.append(input, element('span', formatStorage(item.gb)));
    return label;
  }));
}

function conditionChoice(item, name, type) {
  const label = element('label', undefined, 'condition-option');
  const input = document.createElement('input');
  input.type = type; input.name = name; input.value = item.id;
  input.checked = name === 'appearance' && item.id === 'pristine';
  const copy = element('span', undefined, 'condition-copy');
  copy.append(element('strong', item.label), element('small', item.description));
  const price = element('span', item.id === 'pristine' ? 'Sem desconto' : 'Selecione um modelo', 'condition-price');
  price.dataset.deduction = item.id;
  label.append(input, copy, price);
  return label;
}

function readState() {
  const values = new FormData(form);
  return {
    tradeModel: values.get('tradeModel'), tradeCapacity: Number(values.get('tradeCapacity')),
    appearance: values.get('appearance'), damageIds: values.getAll('damages'), eligible: values.get('eligible'),
    targetModel: values.get('targetModel'), targetCapacity: Number(values.get('targetCapacity')),
    targetCondition: values.get('targetCondition'), bonus: values.has('bonus'),
    payment: values.get('payment'), installments: Number(values.get('installments')),
  };
}

function addLine(parent, label, value, className) {
  const row = element('div', undefined, className);
  row.append(element('dt', label), element('dd', value));
  parent.append(row);
}

function render() {
  const state = readState();
  const hasDevice = config.tradeIn.some(model => model.id === state.tradeModel);
  const ready = hasDevice && Boolean(state.eligible);
  $('#trade-memory').hidden = !hasDevice;
  $('[data-panel="2"]').hidden = !hasDevice;
  $('[data-panel="3"]').hidden = !hasDevice;
  $('#estimate-breakdown').hidden = !hasDevice;
  $('#destination-summary').hidden = !hasDevice;
  $('#copy-summary').disabled = !hasDevice;
  $('#summary-whatsapp').hidden = !ready;
  $('#form-whatsapp').hidden = !ready;
  $('#summary-continue').hidden = ready;
  $('#form-review').hidden = ready;
  $('#form-guidance').textContent = ready ? 'Tudo certo. A Maria confere a avaliação com você.'
    : hasDevice ? 'Confirme as condições do aparelho para conversar com a Maria.' : 'Escolha seu iPhone para começar.';
  for (const button of [$('#summary-continue'), $('#form-review')]) {
    button.firstChild.textContent = hasDevice ? 'Confirmar condições ' : 'Selecionar meu iPhone ';
  }
  $('#trade-value').classList.toggle('empty-value', !hasDevice);
  $('.mobile-estimate').classList.toggle('is-empty', !hasDevice);
  if (!hasDevice) {
    $('#trade-value').textContent = 'Escolha seu iPhone';
    $('#trade-value').classList.remove('manual-value');
    $('#mobile-trade-value').textContent = 'Selecione um modelo';
    $('#estimate-note').textContent = 'Escolha seu modelo para ver uma estimativa. Depois, informe as condições do aparelho.';
    $('#breakdown-lines').replaceChildren();
    $('#summary-whatsapp').removeAttribute('href');
    $('#form-whatsapp').removeAttribute('href');
    $('#copy-fallback').value = '';
    return;
  }
  const result = calculateUpgrade(config, state);
  $('#condition-device').textContent = `${result.model.name} · ${formatStorage(result.capacity.gb)}`;
  $('#trade-value').textContent = result.manualReview ? 'Vamos avaliar' : formatMoney(result.creditCents);
  $('#mobile-trade-value').textContent = result.manualReview ? 'Vamos avaliar' : formatMoney(result.creditCents);
  $('#trade-value').classList.toggle('manual-value', result.manualReview);
  const lines = $('#breakdown-lines');
  lines.replaceChildren();
  addLine(lines, 'Valor-base do aparelho', formatMoney(result.capacity.baseCents));
  for (const item of result.items) addLine(lines, item.label, item.deductionCents === null ? 'Avaliação individual' : `− ${formatMoney(item.deductionCents)}`, 'deduction-line');
  if (result.bonusCents) addLine(lines, 'Bônus de troca', `+ ${formatMoney(result.bonusCents)}`, 'bonus-line');
  if (!result.items.length) addLine(lines, 'Avarias informadas', 'Nenhuma');
  addLine(lines, 'Estimativa de troca', result.manualReview ? 'Avaliação individual' : formatMoney(result.creditCents), 'total-line');
  $('#target-summary').textContent = `${result.target.name} · ${formatStorage(result.targetCapacity.gb)} · ${state.targetCondition === 'sealed' ? 'Lacrado' : 'Seminovo'}`;
  $('#target-price').textContent = result.priceCents === null ? 'A confirmar' : formatMoney(result.priceCents);
  $('#difference').textContent = result.differenceCents === null ? 'Sob consulta' : formatMoney(result.differenceCents);
  $('#estimate-note').textContent = result.unpricedItems.length
    ? 'Há um item selecionado sem desconto tabelado para este modelo e memória. A Maria precisa avaliar antes de informar um valor.'
    : result.manualReview ? 'Se o aparelho não liga ou tem bloqueio de conta, a Maria precisa avaliar antes de informar um valor.'
    : result.exhausted ? 'Os descontos atingiram o valor-base. A Maria precisa conferir o aparelho para uma avaliação individual.'
    : 'Estimativa sujeita à conferência do aparelho. Preço de venda e diferença confirmados pela Maria.';
  $('#installment-field').hidden = state.payment !== 'card';
  $('#payment-hint').textContent = state.payment === 'card'
    ? 'Até 18x no cartão, com juros. A Maria informa taxas, parcelas e total antes do pagamento.'
    : 'Valor final e condições combinados antes do pagamento.';
  const installmentResult = $('#installment-result');
  installmentResult.hidden = state.payment !== 'card';
  installmentResult.textContent = result.totalCents === null
    ? `${state.installments}x no cartão: valor e juros a confirmar.`
    : `${result.installments}x de aproximadamente ${formatMoney(result.installmentCents)}. Total: ${formatMoney(result.totalCents)}.`;
  const bonusVisible = config.bonus.enabled && state.targetCondition === config.bonus.condition;
  $('#bonus-option').hidden = !bonusVisible;
  $('#bonus-label').textContent = `Considerar bônus de ${formatMoney(config.bonus.amountCents)} na troca por seminovo`;
  for (const amount of document.querySelectorAll('[data-deduction]')) {
    const cents = result.deductionTable[amount.dataset.deduction];
    amount.textContent = cents === null ? 'Avaliação individual' : cents ? `− ${formatMoney(cents)}` : 'Sem desconto';
    amount.closest('.condition-option').classList.toggle('needs-review', cents === null);
  }
  const message = buildUpgradeMessage(config, state, result);
  const url = `https://wa.me/${config.whatsapp}?${new URLSearchParams({ text: message })}`;
  for (const link of [$('#summary-whatsapp'), $('#form-whatsapp')]) {
    if (ready) link.href = url;
    else link.removeAttribute('href');
  }
  $('#copy-fallback').value = message;
}

function focusMissingDetails() {
  if (!readState().tradeModel) {
    $('#form-error').textContent = 'Selecione seu modelo de iPhone para começar.';
    $('#form-error').hidden = false;
    $('#trade-model-search').setAttribute('aria-invalid', 'true');
    tradePicker.focus();
  } else if (!readState().eligible) {
    $('#form-error').textContent = 'Informe se o aparelho liga e se você consegue remover a conta iCloud.';
    $('#form-error').hidden = false;
    form.querySelector('[name="eligible"]').focus();
  }
}

async function load() {
  $('#loading').hidden = false;
  $('#load-error').hidden = true;
  $('#upgrade-app').hidden = true;
  try {
    const response = await fetch('/config/upgrade.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Tabela indisponível (${response.status})`);
    config = validateUpgradeConfig(await response.json());
    initializeChoices();
    render();
    $('#upgrade-app').hidden = false;
  } catch (error) {
    console.error('Não foi possível carregar o simulador:', error);
    $('#load-error').hidden = false;
  } finally {
    $('#loading').hidden = true;
  }
}

function initializeChoices() {
  tradePicker.setOptions(config.tradeIn);
  targetPicker.setOptions(config.targets, config.targets.some(model => model.id === 'iphone-16') ? 'iphone-16' : config.targets[0].id);
  fillCapacities('trade', 128); fillCapacities('target', 128);
  $('#appearance-options').replaceChildren(...config.appearance.map(item => conditionChoice(item, 'appearance', 'radio')));
  $('#damage-options').replaceChildren(...config.damages.map(item => conditionChoice(item, 'damages', 'checkbox')));
  $('#installments').replaceChildren(...config.payments.installments.map(count => {
    const option = element('option', `${count}x no cartão`); option.value = count; return option;
  }));
  $('#installments').value = config.payments.installments.includes(12) ? '12' : String(config.payments.installments[0]);
}

form.addEventListener('submit', event => { event.preventDefault(); focusMissingDetails(); });
form.addEventListener('change', event => {
  if (!config || event.target.matches('[data-picker-search]')) return;
  if (event.target.id === 'trade-model') {
    fillCapacities('trade', readState().tradeCapacity);
    $('#trade-model-search').removeAttribute('aria-invalid');
    trackEvent('product_select', { product: event.target.value });
  }
  if (event.target.id === 'target-model') fillCapacities('target', readState().targetCapacity);
  if (event.target.name === 'targetCondition' && event.target.value !== config.bonus.condition) form.elements.bonus.checked = false;
  $('#form-error').hidden = true;
  $('#copy-status').textContent = '';
  $('#copy-fallback').hidden = true;
  render();
});
$('#form-review').addEventListener('click', focusMissingDetails);
$('#summary-continue').addEventListener('click', focusMissingDetails);
$('#reset-simulation').addEventListener('click', () => {
  form.reset(); initializeChoices(); render();
  $('#form-error').hidden = true;
  $('#trade-model-search').removeAttribute('aria-invalid');
  tradePicker.focus();
  $('#copy-status').textContent = ''; $('#copy-fallback').hidden = true;
});
$('#copy-summary').addEventListener('click', async () => {
  const state = readState();
  if (!state.tradeModel) return;
  const text = buildUpgradeMessage(config, state, calculateUpgrade(config, state));
  try {
    await navigator.clipboard.writeText(text);
    $('#copy-status').textContent = 'Resumo copiado. Pode compartilhar!';
    $('#copy-fallback').hidden = true;
  } catch {
    $('#copy-status').textContent = 'Selecione e copie o resumo abaixo.';
    $('#copy-fallback').value = text; $('#copy-fallback').hidden = false; $('#copy-fallback').focus(); $('#copy-fallback').select();
  }
});
for (const link of [$('#summary-whatsapp'), $('#form-whatsapp')]) link.addEventListener('click', () => {
  const state = readState(); trackEvent('upgrade_whatsapp', { product: state.targetModel, condition: state.targetCondition });
});
$('#retry').addEventListener('click', load);
load();
