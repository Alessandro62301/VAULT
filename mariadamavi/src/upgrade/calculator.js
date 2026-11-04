const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const formatMoney = cents => money.format(cents / 100);
export const formatStorage = gb => gb >= 1024 ? `${gb / 1024} TB` : `${gb} GB`;

const isMoney = value => Number.isSafeInteger(value) && value >= 0;
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const uniqueIds = list => new Set(list.map(item => item.id)).size === list.length;

export function validateUpgradeConfig(config) {
  assert(config?.schemaVersion === 1, 'Versão da tabela não suportada.');
  for (const key of ['tradeIn', 'targets', 'appearance', 'damages']) {
    assert(Array.isArray(config[key]) && config[key].length > 0 && uniqueIds(config[key]), `Tabela inválida: ${key}.`);
    for (const item of config[key]) assert(typeof item.id === 'string' && typeof (item.name ?? item.label) === 'string', 'Item inválido na tabela.');
  }
  for (const model of [...config.tradeIn, ...config.targets]) {
    assert(Array.isArray(model.capacities) && model.capacities.length > 0, 'Capacidades ausentes.');
    assert(new Set(model.capacities.map(c => c.gb)).size === model.capacities.length, 'Capacidade duplicada.');
    for (const capacity of model.capacities) {
      assert(Number.isSafeInteger(capacity.gb) && capacity.gb > 0, 'Capacidade inválida.');
      if ('baseCents' in capacity) assert(isMoney(capacity.baseCents), 'Valor-base inválido.');
      else for (const condition of ['sealed', 'used']) assert(capacity.prices && (capacity.prices[condition] === null || isMoney(capacity.prices[condition])), 'Preço de venda inválido.');
    }
    for (const amount of Object.values(model.deductions ?? {})) assert(isMoney(amount), 'Desconto por modelo inválido.');
  }
  for (const item of [...config.appearance, ...config.damages]) assert(isMoney(item.deductionCents), 'Desconto inválido.');
  assert(config.bonus && isMoney(config.bonus.amountCents) && typeof config.bonus.enabled === 'boolean', 'Bônus inválido.');
  assert(/^[1-9]\d{9,14}$/.test(config.whatsapp), 'Contato inválido.');
  assert(config.payments && Array.isArray(config.payments.installments) && config.payments.installments.length > 0, 'Parcelamento ausente.');
  for (const count of config.payments.installments) {
    const rate = config.payments.cardRatesBasisPoints?.[count];
    assert(Number.isSafeInteger(count) && count >= 1 && count <= 18 && (rate === null || isMoney(rate)), 'Parcelamento inválido.');
  }
  return config;
}

export function calculateUpgrade(config, state) {
  const model = config.tradeIn.find(item => item.id === state.tradeModel);
  const capacity = model?.capacities.find(item => item.gb === Number(state.tradeCapacity));
  const appearance = config.appearance.find(item => item.id === state.appearance);
  const target = config.targets.find(item => item.id === state.targetModel);
  const targetCapacity = target?.capacities.find(item => item.gb === Number(state.targetCapacity));
  assert(model && capacity && appearance && target && targetCapacity, 'Selecione uma combinação disponível.');
  assert(['sealed', 'used'].includes(state.targetCondition) && ['pix', 'card'].includes(state.payment), 'Opção de compra inválida.');
  assert(state.eligible === null || ['yes', 'no'].includes(state.eligible), 'Condição de desbloqueio inválida.');
  const damageIds = [...new Set(state.damageIds ?? [])];
  const damages = damageIds.map(id => config.damages.find(item => item.id === id));
  assert(damages.every(Boolean), 'Condição de aparelho inválida.');
  const items = [appearance, ...damages].map(item => ({ ...item, deductionCents: model.deductions?.[item.id] ?? item.deductionCents }));
  const deductionsCents = items.reduce((total, item) => total + item.deductionCents, 0);
  assert(isMoney(deductionsCents), 'Total de descontos inválido.');
  const eligible = state.eligible !== 'no';
  const tradeCents = eligible ? Math.max(0, capacity.baseCents - deductionsCents) : null;
  const bonusCents = eligible && config.bonus.enabled && state.bonus && state.targetCondition === config.bonus.condition ? config.bonus.amountCents : 0;
  const creditCents = tradeCents === null ? null : tradeCents + bonusCents;
  const priceCents = targetCapacity.prices[state.targetCondition];
  const differenceCents = priceCents === null || creditCents === null ? null : Math.max(0, priceCents - creditCents);
  const installments = state.payment === 'card' ? Number(state.installments) : 1;
  assert(state.payment === 'pix' || config.payments.installments.includes(installments), 'Número de parcelas inválido.');
  const rate = state.payment === 'pix' ? 0 : config.payments.cardRatesBasisPoints[installments];
  const totalCents = differenceCents === null || rate === null ? null : differenceCents + Math.round(differenceCents * rate / 10000);
  assert(totalCents === null || isMoney(totalCents), 'Total inválido.');
  return { model, capacity, appearance, damages, items: items.filter(item => item.deductionCents > 0), deductionsCents,
    tradeCents, bonusCents, creditCents, priceCents, differenceCents, totalCents, installments,
    installmentCents: totalCents === null ? null : Math.ceil(totalCents / installments),
    target, targetCapacity, manualReview: !eligible, exhausted: eligible && tradeCents === 0 };
}

export function buildUpgradeMessage(config, state, result) {
  const condition = state.targetCondition === 'sealed' ? 'lacrado' : 'seminovo';
  const lines = ['Oi, Maria! Vim pelo site e fiz uma simulação de upgrade na Mavi.', '',
    `Meu aparelho: ${result.model.name} ${formatStorage(result.capacity.gb)}.`,
    `Aparência: ${result.appearance.label}.`,
    `Condições: ${result.damages.length ? result.damages.map(item => item.label).join('; ') : 'sem avarias informadas'}.`,
    `Liga e consigo remover o iCloud: ${state.eligible === 'yes' ? 'sim' : state.eligible === 'no' ? 'não / preciso de ajuda' : 'a confirmar'}.`,
    result.manualReview ? 'Aparelho precisa de avaliação individual.' : `Estimativa de referência para o usado: ${formatMoney(result.creditCents)} (sujeita à avaliação).`,
    `Quero: ${result.target.name} ${formatStorage(result.targetCapacity.gb)}, ${condition}.`,
    `Pagamento: ${state.payment === 'pix' ? 'PIX' : `cartão em ${result.installments}x, com juros a confirmar`}.`];
  if (result.differenceCents !== null) lines.push(`Diferença estimada no PIX: ${formatMoney(result.differenceCents)}.`);
  lines.push('', 'Pode conferir meu aparelho, a disponibilidade e a diferença final para o upgrade?');
  return lines.join('\n');
}
