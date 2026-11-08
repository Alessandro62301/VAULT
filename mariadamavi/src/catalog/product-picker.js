const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

// Suggestions enhance a free-text field: dismissing never discards a typed product.
export function createProductPicker(input, options, onSelect = () => {}) {
  const controller = new AbortController();
  const { signal } = controller;
  const root = document.createElement('div');
  root.className = 'sale-picker';
  input.replaceWith(root); root.append(input);
  input.removeAttribute('list');
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-label', 'Produto');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'false');
  const id = `suggestions-${crypto.randomUUID()}`;
  input.setAttribute('aria-controls', id);
  const toggle = document.createElement('button');
  toggle.type = 'button'; toggle.className = 'sale-picker-toggle'; toggle.tabIndex = -1;
  toggle.textContent = '⌄'; toggle.setAttribute('aria-label', 'Mostrar sugestões de produtos');
  const popup = document.createElement('div');
  popup.className = 'sale-picker-popup'; popup.hidden = true;
  const header = document.createElement('div'); header.className = 'sale-picker-header';
  const title = document.createElement('span'); title.textContent = 'PRODUTOS';
  const count = document.createElement('span'); count.setAttribute('role', 'status');
  header.append(title, count);
  const list = document.createElement('div'); list.id = id; list.className = 'sale-picker-list';
  list.setAttribute('role', 'listbox'); list.setAttribute('aria-label', 'Sugestões de produtos');
  const empty = document.createElement('p'); empty.className = 'sale-picker-empty';
  empty.textContent = 'Nenhum produto encontrado. Você pode usar o nome que digitou.';
  const hint = document.createElement('div'); hint.className = 'sale-picker-hint';
  hint.textContent = '↑ ↓ navegar · Enter selecionar · Esc fechar';
  popup.append(header, list, empty, hint); root.append(toggle, popup);
  let matches = [];
  let active = -1;

  function setActive(index, scroll = false) {
    active = index;
    [...list.children].forEach((row, i) => row.classList.toggle('is-active', i === index));
    const row = list.children[index];
    if (row) {
      input.setAttribute('aria-activedescendant', row.id);
      if (scroll) row.scrollIntoView({ block: 'nearest' });
    } else input.removeAttribute('aria-activedescendant');
  }
  function close() {
    popup.hidden = true; root.classList.remove('is-open');
    input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant');
  }
  function position() {
    if (popup.hidden) return;
    const box = input.getBoundingClientRect();
    const viewport = window.visualViewport;
    const top = viewport?.offsetTop ?? 0;
    const bottom = top + (viewport?.height ?? window.innerHeight);
    const below = bottom - box.bottom - 12;
    const above = box.top - top - 12;
    const up = below < 240 && above > below;
    root.classList.toggle('opens-up', up);
    root.style.setProperty('--suggestions-height', `${Math.max(70, Math.min(260, (up ? above : below) - 82))}px`);
  }
  function choose(option) {
    input.value = option.name;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    onSelect(option);
    close(); input.focus({ preventScroll: true });
  }
  function open() {
    const terms = normalize(input.value).split(/\s+/).filter(Boolean);
    matches = options.filter(option => terms.every(term => normalize(option.name).includes(term)));
    list.replaceChildren(...matches.map((option, index) => {
      const row = document.createElement('div'); row.className = 'sale-picker-option';
      row.id = `${id}-${index}`; row.setAttribute('role', 'option');
      row.setAttribute('aria-selected', String(option.name === input.value));
      const copy = document.createElement('span');
      const name = document.createElement('strong'); name.textContent = option.name;
      const detail = document.createElement('small'); detail.textContent = option.detail;
      const check = document.createElement('span'); check.className = 'sale-picker-check';
      check.textContent = option.name === input.value ? '✓' : '↵'; check.setAttribute('aria-hidden', 'true');
      copy.append(name, detail); row.append(copy, check);
      row.addEventListener('pointerdown', event => event.preventDefault());
      row.addEventListener('click', event => { event.preventDefault(); choose(option); });
      row.addEventListener('pointermove', () => setActive(index));
      return row;
    }));
    count.textContent = `${matches.length} ${matches.length === 1 ? 'opção' : 'opções'}`;
    empty.hidden = matches.length > 0; list.hidden = !matches.length;
    popup.hidden = false; root.classList.add('is-open'); input.setAttribute('aria-expanded', 'true');
    setActive(matches.length ? Math.max(0, matches.findIndex(option => option.name === input.value)) : -1);
    position();
  }
  input.addEventListener('input', open, { signal });
  input.addEventListener('click', () => { if (popup.hidden) open(); }, { signal });
  input.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (popup.hidden) { open(); return; }
      if (matches.length) setActive((active + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length, true);
    } else if (event.key === 'Enter' && !popup.hidden) {
      event.preventDefault(); if (matches[active]) choose(matches[active]); else close();
    } else if (event.key === 'Escape' || event.key === 'Tab') close();
  }, { signal });
  toggle.addEventListener('pointerdown', event => event.preventDefault(), { signal });
  toggle.addEventListener('click', event => { event.preventDefault(); if (popup.hidden) { input.focus({ preventScroll: true }); open(); } else close(); }, { signal });
  root.addEventListener('focusout', event => { if (!root.contains(event.relatedTarget)) close(); }, { signal });
  document.addEventListener('pointerdown', event => { if (!root.contains(event.target)) close(); }, { signal });
  window.addEventListener('resize', position, { signal });
  window.addEventListener('scroll', position, { signal, passive: true });
  window.visualViewport?.addEventListener('resize', position, { signal });
  return { destroy() { controller.abort(); } };
}
