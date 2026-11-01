import test from 'node:test';
import assert from 'node:assert/strict';
import { trackEvent } from '../src/js/measurement.js';

test('registra origem sem copiar mensagens, URL ou dados pessoais', () => {
  const target = {};
  trackEvent('whatsapp_click', { origin: 'hero', section: 'inicio', message: 'privado', href: 'https://wa.me/?text=privado', email: 'privado' }, target);
  assert.deepEqual(target.dataLayer, [{ event: 'whatsapp_click', origin: 'hero', section: 'inicio' }]);
});

test('preserva a fila existente e ignora eventos desconhecidos', () => {
  const target = { dataLayer: [{ event: 'existing' }] };
  trackEvent('unknown', { message: 'privado' }, target);
  trackEvent('product_select', { product: 'iphone' }, target);
  assert.deepEqual(target.dataLayer, [{ event: 'existing' }, { event: 'product_select', product: 'iphone' }]);
});
