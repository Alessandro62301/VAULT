// MacBook Pro: especificações Apple conferidas em 01/11/2026.
// https://www.apple.com/macbook-pro/liquid-retina-xdr-display/specs/
// https://support.apple.com/en-us/125405
export const RULES = {
  m5: { size: ["14"], ram: ["16", "24", "32"], ssd: ["512", "1", "2", "4"] },
  pro: { size: ["14", "16"], ram: ["24", "48", "64"], ssd: ["1", "2", "4"] },
  max: { size: ["14", "16"], ram: ["36", "48", "64", "128"], ssd: ["2", "4", "8"] },
  m6: { size: ["14"], ram: ["16", "24", "32"], ssd: ["1", "2", "4"] },
};
export const CHIP_LABEL = { m5: 'M5', pro: 'M5 Pro', max: 'M5 Max', m6: 'M6' };
export const SSD_LABEL = { 512: "512 GB", 1: "1 TB", 2: "2 TB", 4: "4 TB", 8: "8 TB" };
export const COLOR_LABEL = { preto: "Preto-espacial", prata: "Prateado" };

export function normalizeConfig(config) {
  const next = { ...config };
  const adjusted = [];
  for (const key of ["size", "ram", "ssd"]) {
    const allowed = RULES[next.chip][key];
    if (allowed.includes(next[key])) continue;
    // Compara armazenamento na mesma unidade: 512 GB = 0,5 TB.
    const amount = (value) => key === "ssd" && value === "512" ? 0.5 : Number(value);
    next[key] = allowed.reduce((best, value) =>
      Math.abs(amount(value) - amount(next[key])) < Math.abs(amount(best) - amount(next[key])) ? value : best,
    );
    adjusted.push(key);
  }
  return { config: next, adjusted };
}

export function configText({ size, chip, ram, ssd, color }) {
  const gpu = chip === 'pro' ? ' (GPU de 20 núcleos)' : chip === 'max' ? ` (GPU de ${ram === '36' ? '32' : '40'} núcleos)` : '';
  return `MacBook Pro ${size}″ · chip ${CHIP_LABEL[chip]}${gpu} · ${ram} GB de memória · ${SSD_LABEL[ssd]} · ${COLOR_LABEL[color]}`;
}
