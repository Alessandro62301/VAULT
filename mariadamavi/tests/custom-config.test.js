import test from "node:test";
import assert from "node:assert/strict";
import { normalizeConfig, configText } from "../src/js/custom-config.js";
import { whatsappLink } from "../src/js/whatsapp.js";

const base = { size: "16", chip: "max", ram: "128", ssd: "8", color: "preto" };

test("trocar Max por Pro ajusta opções incompatíveis e preserva tamanho e cor", () => {
  const { config, adjusted } = normalizeConfig({ ...base, chip: "pro", color: "prata" });
  assert.deepEqual(config, { size: "16", chip: "pro", ram: "64", ssd: "4", color: "prata" });
  assert.deepEqual(adjusted, ["ram", "ssd"]);
});

test("M5 Max exige pelo menos 2 TB ao migrar de 512 GB", () => {
  const { config } = normalizeConfig({ ...base, ram: "24", ssd: "512" });
  assert.equal(config.ram, "36");
  assert.equal(config.ssd, "2");
});

test("opções compartilhadas não mudam ao trocar chip", () => {
  for (const chip of ["pro", "max"]) {
    const selected = { ...base, chip, ram: "48", ssd: "2", size: "14" };
    const { config, adjusted } = normalizeConfig(selected);
    assert.deepEqual(config, selected);
    assert.deepEqual(adjusted, []);
  }
});

test("WhatsApp recebe somente a configuração final compatível", () => {
  const { config } = normalizeConfig({ ...base, chip: "pro", color: "prata" });
  const url = new URL(whatsappLink("sob-medida", `${configText(config)}. Pode me passar o valor e o prazo?`));
  assert.equal(url.pathname, "/5521920184210");
  const message = url.searchParams.get("text");
  assert.match(message, /MacBook Pro 16″ · chip M5 Pro \(GPU de 20 núcleos\) · 64 GB de memória · 4 TB · Prateado/);
  assert.doesNotMatch(message, /128 GB|8 TB/);
});

test("M6 ajusta tela, memória e armazenamento incompatíveis com a configuração anterior", () => {
  const { config, adjusted } = normalizeConfig({ ...base, chip: 'm6' });
  assert.deepEqual(config, { size: '14', chip: 'm6', ram: '32', ssd: '4', color: 'preto' });
  assert.deepEqual(adjusted, ['size', 'ram', 'ssd']);
});

test("M5 mantém 512 GB e restringe a tela a 14 polegadas", () => {
  const { config } = normalizeConfig({ ...base, chip: 'm5', ram: '16', ssd: '512' });
  assert.equal(config.size, '14');
  assert.equal(config.ssd, '512');
  assert.match(configText(config), /chip M5 · 16 GB/);
});

test("M5 Max descreve a GPU correspondente à memória na proposta", () => {
  assert.match(configText({ ...base, ram: '36' }), /GPU de 32 núcleos/);
  assert.match(configText({ ...base, ram: '128' }), /GPU de 40 núcleos/);
});
