import { gsap } from "gsap";
import { whatsappLink } from "./whatsapp.js";

// Combinações que a Apple oferece: o chip Pro vai até 48 GB e 4 TB; o Max, até 128 GB e 8 TB.
const RULES = {
  pro: { ram: ["24", "48"], ssd: ["512", "1", "2", "4"] },
  max: { ram: ["36", "48", "64", "128"], ssd: ["1", "2", "4", "8"] },
};
const SSD_LABEL = { 512: "512 GB", 1: "1 TB", 2: "2 TB", 4: "4 TB", 8: "8 TB" };
const COLOR_LABEL = { preto: "Preto-espacial", prata: "Prateado" };

export function initCustom() {
  const section = document.querySelector(".custom");
  if (!section) return;
  const form = section.querySelector(".cfg");
  const summary = form.querySelector(".cfg__summary");
  const cta = form.querySelector(".cfg__cta");
  const out = Object.fromEntries([...section.querySelectorAll("[data-out]")].map((el) => [el.dataset.out, el]));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let ramShown = 128;

  const value = (name) => form.querySelector(`input[name="${name}"]:checked`)?.value;

  // Desliga o que o chip escolhido não oferece e, se preciso, pula para a opção válida mais próxima
  const applyRules = () => {
    const rule = RULES[value("chip")];
    ["ram", "ssd"].forEach((name) => {
      const inputs = [...form.querySelectorAll(`input[name="${name}"]`)];
      inputs.forEach((i) => (i.disabled = !rule[name].includes(i.value)));
      const current = inputs.find((i) => i.checked);
      if (current.disabled) {
        const allowed = inputs.filter((i) => !i.disabled);
        const target = Number(current.value);
        const nearest = allowed.reduce((a, b) => (Math.abs(b.value - target) < Math.abs(a.value - target) ? b : a));
        nearest.checked = true;
      }
    });
  };

  // Troca uma linha da leitura gigante: sai subindo, entra de baixo
  const swap = (el, html) => {
    if (el.dataset.target === html) return;
    el.dataset.target = html;
    if (reduced) {
      el.innerHTML = html;
      return;
    }
    el._swap?.kill();
    el._swap = gsap
      .timeline()
      .to(el, { yPercent: -40, autoAlpha: 0, duration: 0.18, ease: "power2.in" })
      .call(() => (el.innerHTML = html))
      .fromTo(el, { yPercent: 40, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: "expo.out" });
  };

  const render = () => {
    const size = value("size");
    const chip = value("chip");
    const ram = Number(value("ram"));
    const ssd = value("ssd");
    const color = value("color");

    section.dataset.size = size;
    section.dataset.color = color;
    swap(out.size, `${size}″`);
    swap(out.chip, `Chip ${chip === "max" ? "Max" : "Pro"}`);
    swap(out.ssd, SSD_LABEL[ssd]);

    // a memória conta até o número novo
    const b = out.ram.querySelector("b");
    if (reduced) b.textContent = ram;
    else {
      const counter = { v: ramShown };
      gsap.to(counter, { v: ram, duration: 0.6, ease: "expo.out", onUpdate: () => (b.textContent = Math.round(counter.v)) });
    }
    ramShown = ram;

    const text = `MacBook Pro ${size}″ · chip ${chip === "max" ? "Max" : "Pro"} · ${ram} GB de memória · ${SSD_LABEL[ssd]} · ${COLOR_LABEL[color]}`;
    summary.textContent = text;
    cta.href = whatsappLink("sob-medida", `${text}. Pode me passar o valor e o prazo?`);
  };

  form.addEventListener("change", (e) => {
    if (e.target.name === "chip") applyRules();
    render();
  });
  form.addEventListener("submit", (e) => e.preventDefault());

  applyRules();
  render();
}
