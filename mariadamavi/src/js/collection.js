export function initCollection() {
  const section = document.querySelector('.collection');
  if (!section) return;
  const track = section.querySelector('.collection__track');
  const cards = [...track.children];
  const prev = section.querySelector('[data-collection-prev]');
  const next = section.querySelector('[data-collection-next]');
  const dialog = section.querySelector('dialog');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  section.querySelector('.collection__controls').hidden = false;
  const update = () => {
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
  };
  let step = cards[1].offsetLeft - cards[0].offsetLeft;
  const move = direction => {
    track.scrollBy({ left: direction * step, behavior: reduced.matches ? 'instant' : 'smooth' });
  };
  prev.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  track.addEventListener('scroll', update, { passive: true });
  track.addEventListener('keydown', event => {
    if (event.target !== track || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    move(event.key === 'ArrowLeft' ? -1 : 1);
  });
  new ResizeObserver(() => {
    const nextStep = cards[1].offsetLeft - cards[0].offsetLeft;
    if (Math.abs(nextStep - step) > 1) {
      const index = Math.round(track.scrollLeft / step);
      track.scrollTo({ left: index * nextStep, behavior: 'instant' });
      step = nextStep;
    }
    update();
  }).observe(track);
  section.querySelectorAll('[data-edition]').forEach(button => button.addEventListener('click', () => {
    const preview = document.createElement('div');
    preview.className = button.className;
    for (const child of button.children) preview.append(child.cloneNode(true));
    const photo = preview.querySelector('img');
    if (photo?.dataset.fullSrc) {
      preview.querySelectorAll('source').forEach(source => source.remove());
      photo.removeAttribute('srcset');
      photo.removeAttribute('sizes');
      photo.src = photo.dataset.fullSrc;
      photo.loading = 'eager';
    }
    section.querySelector('.collection__enlarged').replaceChildren(preview);
    section.querySelector('#edition-title').textContent = button.closest('article').querySelector('h3').textContent;
    dialog.showModal();
  }));
  section.querySelector('[data-collection-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  update();
}
