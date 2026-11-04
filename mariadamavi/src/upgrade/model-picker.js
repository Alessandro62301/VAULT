const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const capacityLabel = value => value >= 1024 ? `${value / 1024} TB` : `${value} GB`;

// Editable combobox: the hidden input holds the committed model, while typing
// only filters the popup. Closing without selecting restores the committed label.
export function createModelPicker(root) {
  const valueInput = root.querySelector('input[type="hidden"]');
  const search = root.querySelector('[data-picker-search]');
  const toggle = root.querySelector('[data-picker-toggle]');
  const popup = root.querySelector('[data-picker-popup]');
  const list = root.querySelector('[role="listbox"]');
  const count = root.querySelector('[data-picker-count]');
  const empty = root.querySelector('[data-picker-empty]');
  let options = [];
  let matches = [];
  let active = -1;
  let opened = false;

  function restoreLabel() {
    search.value = options.find(option => option.id === valueInput.value)?.name ?? '';
    root.classList.toggle('has-selection', Boolean(valueInput.value));
  }

  function setActive(index, scroll = false) {
    active = index;
    Array.from(list.children).forEach((row, i) => row.classList.toggle('is-active', i === active));
    const row = list.children[active];
    if (row) {
      search.setAttribute('aria-activedescendant', row.id);
      if (scroll) row.scrollIntoView({ block: 'nearest' });
    } else search.removeAttribute('aria-activedescendant');
  }

  function close() {
    opened = false;
    popup.hidden = true;
    search.setAttribute('aria-expanded', 'false');
    search.removeAttribute('aria-activedescendant');
    root.classList.remove('is-open', 'opens-upward');
    restoreLabel();
  }

  function choose(option, dismissKeyboard = false) {
    const changed = valueInput.value !== option.id;
    valueInput.value = option.id;
    close();
    if (dismissKeyboard) search.blur();
    else search.focus({ preventScroll: true });
    if (changed) valueInput.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function renderMatches(query = '') {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    matches = options.filter(option => terms.every(term => normalize(option.name).includes(term)));
    list.replaceChildren(...matches.map((option, index) => {
      const row = document.createElement('div');
      row.className = 'model-picker__option';
      row.id = `${valueInput.id}-option-${index}`;
      row.setAttribute('role', 'option');
      row.setAttribute('aria-selected', String(option.id === valueInput.value));
      const copy = document.createElement('span');
      const title = document.createElement('strong');
      title.textContent = option.name;
      const capacities = document.createElement('small');
      capacities.textContent = option.capacities.map(capacity => capacityLabel(capacity.gb)).join(' · ');
      copy.append(title, capacities);
      const check = document.createElement('span');
      check.className = 'model-picker__check';
      check.textContent = option.id === valueInput.value ? '✓' : '';
      check.setAttribute('aria-hidden', 'true');
      row.append(copy, check);
      row.addEventListener('pointerdown', event => event.preventDefault());
      row.addEventListener('click', event => choose(option, event.pointerType === 'touch'));
      return row;
    }));
    count.textContent = `${matches.length} ${matches.length === 1 ? 'modelo' : 'modelos'}`;
    empty.hidden = matches.length !== 0;
    const selected = matches.findIndex(option => option.id === valueInput.value);
    setActive(selected >= 0 ? selected : matches.length ? 0 : -1);
  }

  function positionPopup() {
    if (!opened) return;
    const box = root.getBoundingClientRect();
    const viewport = window.visualViewport;
    const top = viewport?.offsetTop ?? 0;
    let bottom = top + (viewport?.height ?? window.innerHeight);
    const mobileBar = document.querySelector('.mobile-estimate')?.getBoundingClientRect();
    if (mobileBar?.height && mobileBar.top > top) bottom = Math.min(bottom, mobileBar.top - 8);
    const below = bottom - box.bottom;
    const above = box.top - top;
    const upward = below < 290 && above > below && above > 180;
    root.classList.toggle('opens-upward', upward);
    const available = upward ? above : below;
    root.style.setProperty('--picker-list-max', `${Math.max(90, Math.min(264, available - 88))}px`);
  }

  function open() {
    if (opened) return;
    opened = true;
    popup.hidden = false;
    search.setAttribute('aria-expanded', 'true');
    root.classList.add('is-open');
    positionPopup();
    renderMatches();
    setActive(active, true);
  }

  search.addEventListener('focus', () => { open(); search.select(); });
  search.addEventListener('click', open);
  search.addEventListener('input', () => { if (!opened) open(); renderMatches(search.value); list.scrollTop = 0; });
  search.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const wasOpen = opened;
      open();
      if (matches.length) {
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        const next = wasOpen ? (active + direction + matches.length) % matches.length : active < 0 ? 0 : active;
        setActive(next, true);
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (opened && matches[active]) choose(matches[active]);
      else open();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'Tab') close();
  });
  toggle.addEventListener('pointerdown', event => event.preventDefault());
  toggle.addEventListener('click', () => {
    if (opened) close();
    else { open(); search.focus({ preventScroll: true }); search.select(); }
  });
  document.addEventListener('pointerdown', event => { if (!root.contains(event.target)) close(); });
  root.addEventListener('focusout', event => { if (!root.contains(event.relatedTarget)) close(); });
  window.addEventListener('resize', positionPopup);
  window.addEventListener('scroll', positionPopup, { passive: true });
  window.visualViewport?.addEventListener('resize', positionPopup);

  return {
    setOptions(items, selected = '') {
      options = items;
      valueInput.value = items.some(item => item.id === selected) ? selected : '';
      close();
    },
    focus() { search.focus(); },
    close,
  };
}
