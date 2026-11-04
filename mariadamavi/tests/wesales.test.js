import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWeSalesTracking, setWeSalesScriptURL, WESALES_TRACKING_URL, WESALES_TRACKING_ID } from '../src/js/wesales.js';
import { trackEvent } from '../src/js/measurement.js';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function browser(hostname) {
  const scripts = [];
  return { scripts, location: { hostname }, document: {
    querySelector: () => scripts.find(s => s.dataset.wesalesTracking),
    createElement: () => ({ dataset: {}, addEventListener() {} }),
    head: { append: s => scripts.push(s) },
  } };
}

test('WeSales exige consentimento concedido em domínio de produção, inclusive após aceitar em localhost', () => {
  for (const host of ['localhost', '127.0.0.1', 'preview.mariadamavi.com.br', 'mariadamavi.com.br.evil.test']) {
    const page = browser(host);
    assert.equal(loadWeSalesTracking('granted', page), false);
    assert.equal(page.scripts.length, 0);
  }
  for (const host of ['mariadamavi.com.br', 'www.mariadamavi.com.br']) {
    const page = browser(host);
    for (const consent of [null, undefined, 'denied', 'true']) assert.equal(loadWeSalesTracking(consent, page), false);
    assert.equal(page.scripts.length, 0);
    assert.equal(loadWeSalesTracking('granted', page), true);
    assert.equal(loadWeSalesTracking('granted', page), true);
    assert.equal(page.scripts.length, 1);
    assert.equal(page.scripts[0].src, WESALES_TRACKING_URL);
    assert.equal(page.scripts[0].dataset.trackingId, WESALES_TRACKING_ID);
  }
});

test('carregador rejeita URLs de scripts fora da lista exata', () => {
  for (const url of ['https://evil.test/a.js', `${WESALES_TRACKING_URL}?evil=1`, 'javascript:alert(1)']) {
    assert.throws(() => setWeSalesScriptURL({}, url, browser('localhost')), /não permitido/);
  }
});

test('evento de abertura não inclui dados do lead nem se transforma em envio', () => {
  const page = {};
  trackEvent('lead_form_open', { section: 'empresas', email: 'privado', name: 'privado' }, page);
  trackEvent('lead_form_submit', { section: 'empresas' }, page);
  assert.deepEqual(page.dataLayer, [{ event: 'lead_form_open', section: 'empresas' }]);
});

test('evento de formulário não é enviado pelo gtag sem consentimento', () => {
  let sent = false;
  trackEvent('lead_form_open', { section: 'empresas' }, { gtag: () => { sent = true; } });
  assert.equal(sent, false);
});

function consentPage(hostname, saved) {
  const page = browser(hostname);
  const store = new Map(saved ? [['mavi-analytics-consent', saved]] : []);
  const accept = { addEventListener: (type, fn) => { accept[type] = fn; } };
  const reject = { addEventListener: (type, fn) => { reject[type] = fn; } };
  const banner = { querySelector: selector => selector.includes('accept') ? accept : reject };
  const query = page.document.querySelector;
  page.document.querySelector = selector => selector === '[data-analytics-consent]' ? banner : selector.includes('wesales-tracking') ? query(selector) : null;
  page.document.addEventListener = () => {};
  page.document.cookie = '';
  page.location.reload = () => { page.reloads = (page.reloads || 0) + 1; };
  const source = readFileSync(new URL('../src/js/measurement.js', import.meta.url), 'utf8')
    .replace(/^import .*?;\r?\n/m, '').replaceAll('export function ', 'function ');
  const context = { window: page, document: page.document, location: page.location, localStorage: {
    getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value),
  }, ANALYTICS_HOSTS: new Set(['mariadamavi.com.br', 'www.mariadamavi.com.br']),
  loadWeSalesTracking: consent => loadWeSalesTracking(consent, page), console, URL };
  vm.runInNewContext(`${source}\ninitMeasurement();`, context);
  return { page, accept, reject, store, context };
}

test('fluxo real do banner só carrega os dois provedores após aceitar; recusa remove listeners por recarga', () => {
  const { page, accept, reject, store, context } = consentPage('mariadamavi.com.br');
  assert.equal(page.scripts.length, 0);
  vm.runInNewContext("trackEvent('lead_form_open', { section: 'empresas' });", context);
  assert.equal(page.dataLayer, undefined);
  accept.click();
  assert.equal(page.scripts.length, 2);
  assert.equal(store.get('mavi-analytics-consent'), 'granted');
  vm.runInNewContext("trackEvent('lead_form_open', { section: 'empresas' });", context);
  assert.equal(Array.from(page.dataLayer.at(-1))[0], 'event');
  reject.click();
  assert.equal(store.get('mavi-analytics-consent'), 'denied');
  assert.equal(page.reloads, 1);
  assert.equal(consentPage('mariadamavi.com.br', 'denied').page.scripts.length, 0);
  assert.equal(consentPage('www.mariadamavi.com.br', 'granted').page.scripts.length, 2);
});

test('o mesmo banner jamais carrega Analytics ou WeSales em localhost e preview', () => {
  for (const host of ['127.0.0.1', 'localhost', 'preview.mariadamavi.com.br']) {
    const { page, accept } = consentPage(host);
    accept.click();
    assert.equal(page.scripts.length, 0);
  }
});
