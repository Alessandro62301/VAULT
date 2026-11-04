import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateUpgradeConfig, calculateUpgrade, buildUpgradeMessage } from '../src/upgrade/calculator.js';

const config = JSON.parse(readFileSync(new URL('../public/config/upgrade.json', import.meta.url), 'utf8'));
const extracted = JSON.parse(readFileSync(new URL('./fixtures/upgrade-discounts.json', import.meta.url), 'utf8'));
const state = { tradeModel: 'iphone-13', tradeCapacity: 128, appearance: 'pristine', damageIds: [], eligible: 'yes',
  targetModel: 'iphone-16', targetCapacity: 128, targetCondition: 'sealed', payment: 'pix', installments: 12, bonus: false };

test('catálogo público tem 92 combinações válidas e mantém os valores da referência', () => {
  validateUpgradeConfig(config);
  assert.equal(config.tradeIn.reduce((count, model) => count + model.capacities.length, 0), 92);
  assert.equal(calculateUpgrade(config, state).tradeCents, 154500);
  assert.equal(calculateUpgrade(config, { ...state, tradeModel: 'iphone-11', tradeCapacity: 64 }).tradeCents, 44000);
});

test('descontos são somados uma vez e aparência é uma escolha exclusiva', () => {
  const result = calculateUpgrade(config, { ...state, appearance: 'light', damageIds: ['battery', 'battery'] });
  assert.equal(result.deductionsCents, 42800);
  assert.equal(result.tradeCents, 111700);
  assert.equal(calculateUpgrade(config, { ...state, appearance: 'moderate', damageIds: ['battery'] }).tradeCents, 89500);
});

test('avarias nunca produzem valor negativo', () => {
  const result = calculateUpgrade(config, { ...state, damageIds: config.damages.map(item => item.id) });
  assert.equal(result.tradeCents, 0);
  assert.equal(result.exhausted, true);
});

test('aparelho bloqueado exige avaliação individual, sem cotação numérica', () => {
  const result = calculateUpgrade(config, { ...state, eligible: 'no' });
  assert.equal(result.manualReview, true);
  assert.equal(result.creditCents, null);
  assert.equal(result.differenceCents, null);
});

test('não usa valor de compra do usado como preço de venda', () => {
  const result = calculateUpgrade(config, state);
  assert.equal(result.priceCents, null);
  assert.equal(result.differenceCents, null);
  assert.equal(result.totalCents, null);
});

test('tabela futura calcula preço, bônus elegível e juros em centavos', () => {
  const edited = structuredClone(config);
  const capacity = edited.targets.find(model => model.id === 'iphone-16').capacities[0];
  capacity.prices.used = 400000;
  edited.bonus.enabled = true;
  edited.payments.cardRatesBasisPoints[18] = 1200;
  const result = calculateUpgrade(edited, { ...state, targetCondition: 'used', bonus: true, payment: 'card', installments: 18 });
  assert.equal(result.creditCents, 164500);
  assert.equal(result.differenceCents, 235500);
  assert.equal(result.totalCents, 263760);
  assert.equal(result.installmentCents, 14654);
  assert.equal(calculateUpgrade(edited, { ...state, bonus: true }).bonusCents, 0);
});

test('taxa não configurada mantém parcelamento sob consulta', () => {
  const edited = structuredClone(config);
  edited.targets.find(model => model.id === 'iphone-16').capacities[0].prices.sealed = 500000;
  const result = calculateUpgrade(edited, { ...state, payment: 'card', installments: 18 });
  assert.equal(result.differenceCents, 345500);
  assert.equal(result.totalCents, null);
});

test('rejeita capacidade, avaria e quantidade de parcelas fora da tabela', () => {
  assert.throws(() => calculateUpgrade(config, { ...state, tradeCapacity: 2048 }));
  assert.throws(() => calculateUpgrade(config, { ...state, damageIds: ['invalid'] }));
  assert.throws(() => calculateUpgrade(config, { ...state, payment: 'card', installments: 99 }));
});

test('configuração inválida não vira uma estimativa silenciosa', () => {
  const edited = structuredClone(config);
  edited.tradeIn[0].capacities[0].baseCents = -1;
  assert.throws(() => validateUpgradeConfig(edited));
  edited.tradeIn[0].capacities[0].baseCents = 1.5;
  assert.throws(() => validateUpgradeConfig(edited));
});

test('resumo para WhatsApp identifica a estimativa como referência e pede proposta', () => {
  const text = buildUpgradeMessage(config, state, calculateUpgrade(config, state));
  assert.match(text, /iPhone 13 128 GB/);
  assert.match(text, /referência/);
  assert.match(text, /sujeita à avaliação/);
  assert.match(text, /diferença final/);
  assert.doesNotMatch(text, /null|undefined/);
});

test('todas as capacidades preservam os descontos da tabela fornecida, inclusive null', () => {
  let priced = 0;
  let missing = 0;
  for (const model of config.tradeIn) for (const capacity of model.capacities) {
    const source = extracted.models.find(row => row.modelId === model.id && row.storageGb === capacity.gb);
    assert.ok(source, `${model.id} ${capacity.gb}`);
    assert.deepEqual(capacity.deductions, source.deductionsCents);
    assert.equal(capacity.baseCents, source.baseCents);
    for (const [id, amount] of Object.entries(source.deductionsCents)) {
      const appearance = ['light', 'moderate'].includes(id);
      const result = calculateUpgrade(config, { ...state, tradeModel: model.id, tradeCapacity: capacity.gb,
        appearance: appearance ? id : 'pristine', damageIds: appearance ? [] : [id] });
      if (amount === null) {
        missing++;
        assert.equal(result.manualReview, true);
        assert.equal(result.creditCents, null);
      } else {
        priced++;
        assert.equal(result.manualReview, false);
        assert.equal(result.tradeCents, Math.max(0, source.baseCents - amount));
      }
    }
  }
  assert.equal(priced, 1003);
  assert.equal(missing, 9);
});

test('mesmo modelo usa descontos diferentes conforme a memória selecionada', () => {
  const choices = { ...state, tradeModel: 'iphone-11', appearance: 'light', damageIds: ['back'] };
  const small = calculateUpgrade(config, { ...choices, tradeCapacity: 64 });
  const medium = calculateUpgrade(config, { ...choices, tradeCapacity: 128 });
  const large = calculateUpgrade(config, { ...choices, tradeCapacity: 256 });
  assert.equal(small.deductionTable.light, 10100);
  assert.equal(small.deductionTable.back, 11400);
  assert.equal(small.tradeCents, 22500);
  assert.equal(medium.deductionTable.light, 11500);
  assert.equal(medium.deductionTable.back, 13400);
  assert.equal(medium.tradeCents, 39100);
  assert.equal(large.tradeCents, 47400);
});

test('modelo mais novo não recebe os valores genéricos antigos', () => {
  const result = calculateUpgrade(config, { ...state, tradeModel: 'iphone-17-pro', tradeCapacity: 256, appearance: 'light', damageIds: ['battery'] });
  assert.equal(result.deductionTable.light, 44800);
  assert.equal(result.deductionTable.battery, 80000);
  assert.equal(result.tradeCents, 415200);
});

test('item sem valor tabelado exige avaliação e não libera bônus, diferença ou parcelas', () => {
  const edited = structuredClone(config);
  edited.bonus.enabled = true;
  edited.targets.find(model => model.id === 'iphone-16').capacities[0].prices.used = 400000;
  edited.damages.find(item => item.id === 'part-camera').deductionCents = 1;
  const selection = { ...state, tradeModel: 'iphone-11', tradeCapacity: 64, damageIds: ['part-camera'], targetCondition: 'used', bonus: true };
  const result = calculateUpgrade(edited, selection);
  assert.equal(result.deductionTable['part-camera'], null);
  assert.equal(result.items[0].deductionCents, null);
  assert.equal(result.unpricedItems[0].id, 'part-camera');
  assert.equal(result.manualReview, true);
  assert.equal(result.creditCents, null);
  assert.equal(result.bonusCents, 0);
  assert.equal(result.differenceCents, null);
  assert.equal(result.totalCents, null);
  const message = buildUpgradeMessage(edited, selection, result);
  assert.match(message, /Itens sem valor tabelado: Aviso de peça: câmera/);
  assert.doesNotMatch(message, /Estimativa de referência para o usado:/);
});

test('zero explícito é válido e não se confunde com um campo ausente', () => {
  const edited = structuredClone(config);
  edited.tradeIn.find(model => model.id === 'iphone-13').capacities[0].deductions.battery = 0;
  validateUpgradeConfig(edited);
  const result = calculateUpgrade(edited, { ...state, damageIds: ['battery'] });
  assert.equal(result.manualReview, false);
  assert.equal(result.creditCents, 154500);
});

test('tabela parcial, valor negativo, fração e versão antiga são rejeitados', () => {
  const partial = structuredClone(config);
  delete partial.tradeIn[0].capacities[0].deductions.battery;
  assert.throws(() => validateUpgradeConfig(partial));
  for (const invalid of [-1, 1.5]) {
    const edited = structuredClone(config);
    edited.tradeIn[0].capacities[0].deductions.battery = invalid;
    assert.throws(() => validateUpgradeConfig(edited));
  }
  assert.throws(() => validateUpgradeConfig({ ...config, schemaVersion: 1 }));
});
