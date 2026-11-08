import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultProfit } from '../src/catalog/profit-rules.js';

test('aplica os lucros por família e condição definidos pela Mavi', () => {
  for (const [name, reais] of [
    ['iPhone 18 Pro 256GB',1000], ['iPhone 16 Pro | Preto · Seminovo',700],
    ['MacBook Air M5 13" | 16GB/512GB',1000], ['MacBook Air M5 15” | 16GB/512GB',1000],
    ['MacBook Air M5 13" | 24GB/1TB',1500], ['MacBook Air M5 15” | 24/1',1500],
    ['MacBook Neo 13" | 8GB/256GB',700], ['MacBook Pro 16" M5 Pro | 48GB/1TB',2000],
    ['MacBook Pro 14" M5 Max | 36GB/2TB',2500], ['iPad 11 A16 128GB',500],
    ['iPad Air M4 11" Wi-Fi 128GB',1200], ['iPad Pro M5 11" | 256GB',2000]
  ]) assert.equal(defaultProfit(name), reais * 100, name);
});
test('outras categorias e configurações não recebem lucro presumido', () => {
  for (const name of ['', 'AirPods Pro 3', 'iPad Mini', 'MacBook Air M5 13" | 16GB/1TB', 'Mac mini M4 Pro', 'MacBook Air M5 15" | 24GB/16TB']) assert.equal(defaultProfit(name),0,name);
});
