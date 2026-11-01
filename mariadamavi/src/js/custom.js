import { gsap } from 'gsap';
import { whatsappLink } from './whatsapp.js';
import { trackEvent } from './measurement.js';
import { RULES, CHIP_LABEL, SSD_LABEL, COLOR_LABEL, normalizeConfig, configText } from './custom-config.js';

const GROUP = { size: 'Tela', chip: 'Chip', ram: 'Memória', ssd: 'Armazenamento', color: 'Cor' };

export function initCustom() {
  const section = document.querySelector('.custom');
  if (!section) return;
  const form = section.querySelector('.cfg');
  const summary = form.querySelector('.cfg__summary');
  const cta = form.querySelector('.cfg__cta');
  const feedback = section.querySelector('.custom__feedback');
  const zone = section.querySelector('.custom__dropzone');
  const prompt = section.querySelector('.custom__drop-prompt strong');
  const outputs = Object.fromEntries([...section.querySelectorAll('[data-out]')].map(el => [el.dataset.out, el]));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let drag = null;
  let suppressedLabel = null;
  let highlightTimer;

  const read = () => Object.fromEntries(Object.keys(GROUP).map(name => [name, form.querySelector(`input[name="${name}"]:checked`).value]));
  const labels = config => ({ size: `${config.size}″`, chip: CHIP_LABEL[config.chip], ram: `${config.ram} GB`, ssd: SSD_LABEL[config.ssd], color: COLOR_LABEL[config.color] });

  function render(changed, dropped = false) {
    const { config, adjusted } = normalizeConfig(read());
    const values = labels(config);
    for (const input of form.querySelectorAll('input[type="radio"]')) {
      input.checked = config[input.name] === input.value;
      if (RULES[config.chip][input.name]) input.disabled = !RULES[config.chip][input.name].includes(input.value);
      input.closest('.cfg__opt').title = input.disabled ? `Indisponível com chip ${values.chip}` : 'Arraste pela alça ou toque para escolher';
    }
    for (const [name, el] of Object.entries(outputs)) el.textContent = values[name];
    section.dataset.size = config.size;
    section.dataset.color = config.color;
    summary.textContent = configText(config);
    cta.href = whatsappLink('sob-medida', `${configText(config)}. Pode me passar o valor e o prazo?`);
    if (!changed) return;
    trackEvent('configuration_change', { option: changed });
    const adjustments = adjusted.map(key => `${GROUP[key]} ${key === 'ssd' ? 'ajustado' : 'ajustada'} para ${values[key]}.`).join(' ');
    feedback.textContent = `${GROUP[changed]}: ${values[changed]}. ${dropped ? 'Bloco encaixado.' : 'Configuração atualizada.'}${adjustments ? ` ${adjustments}` : ''}`;
    clearTimeout(highlightTimer);
    section.querySelectorAll('.is-installed').forEach(el => el.classList.remove('is-installed'));
    const slots = [changed, ...adjusted].map(name => section.querySelector(`[data-slot="${name}"]`));
    slots.forEach(slot => slot.classList.add('is-installed'));
    if (!reduced.matches) {
      gsap.killTweensOf(slots);
      gsap.fromTo(slots, { y: -3 }, { y: 0, duration: .35, ease: 'power2.out' });
    }
    highlightTimer = setTimeout(() => slots.forEach(slot => slot.classList.remove('is-installed')), 650);
  }

  form.addEventListener('change', event => {
    if (event.target.matches('input[type="radio"]')) render(event.target.name);
  });
  form.addEventListener('submit', event => event.preventDefault());

  const inside = (x, y) => {
    const bounds = zone.getBoundingClientRect();
    return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
  };

  function finish(accept = false) {
    if (!drag) return;
    const current = drag;
    drag = null;
    current.ghost?.remove();
    current.block.classList.remove('is-drag-source');
    section.classList.remove('is-dragging', 'is-over');
    if (current.block.hasPointerCapture(current.id)) current.block.releasePointerCapture(current.id);
    if (!current.started) return;
    // Pointerup can synthesize a click on the source label, even after an invalid drop.
    suppressedLabel = current.block;
    if (accept && !current.input.disabled) {
      current.input.checked = true;
      render(current.input.name, true);
    } else {
      feedback.textContent = 'Bloco devolvido. Sua configuração continua a mesma.';
    }
  }

  form.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || drag) return;
    suppressedLabel = null;
    const block = event.target.closest('.cfg__opt');
    if (!block) return;
    const input = block.querySelector('input');
    if (input.disabled) return;
    // The handle reserves dragging on touch screens; the rest of each block permits scrolling.
    if (event.pointerType === 'touch' && !event.target.closest('.cfg__handle')) return;
    drag = { id: event.pointerId, block, input, x: event.clientX, y: event.clientY, started: false };
    block.setPointerCapture(event.pointerId);
  });
  form.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    if (!drag.started && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 7) return;
    event.preventDefault();
    if (!drag.started) {
      drag.started = true;
      drag.ghost = document.createElement('div');
      drag.ghost.className = 'cfg__ghost';
      drag.ghost.setAttribute('aria-hidden', 'true');
      const label = drag.block.querySelector('span').textContent.trim();
      drag.ghost.textContent = `${GROUP[drag.input.name]} · ${label}`;
      document.body.appendChild(drag.ghost);
      drag.block.classList.add('is-drag-source');
      section.classList.add('is-dragging');
      prompt.textContent = `Solte para usar ${label}`;
    }
    const width = drag.ghost.offsetWidth;
    const x = Math.max(6, Math.min(window.innerWidth - width - 6, event.clientX - width / 2));
    drag.ghost.style.transform = `translate3d(${x}px, ${event.clientY - 60}px, 0)`;
    section.classList.toggle('is-over', inside(event.clientX, event.clientY));
  }, { passive: false });
  form.addEventListener('pointerup', event => {
    if (drag && event.pointerId === drag.id) finish(inside(event.clientX, event.clientY));
  });
  form.addEventListener('pointercancel', () => finish());
  form.addEventListener('lostpointercapture', () => finish());
  form.addEventListener('click', event => {
    if (suppressedLabel && event.target.closest('.cfg__opt') === suppressedLabel) {
      event.preventDefault();
      event.stopPropagation();
      suppressedLabel = null;
    }
  }, true);
  form.addEventListener('dragstart', event => event.preventDefault());
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && drag) { event.preventDefault(); finish(); }
  });
  window.addEventListener('blur', () => finish());
  window.addEventListener('resize', () => finish());
  document.addEventListener('visibilitychange', () => { if (document.hidden) finish(); });
  render();
}
