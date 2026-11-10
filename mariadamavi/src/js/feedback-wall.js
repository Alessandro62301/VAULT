export function initFeedbackWall() {
  const wall = document.querySelector('.feedback-wall');
  if (!wall || wall.dataset.ready) return;
  wall.dataset.ready = 'true';
  const canvas = wall.querySelector('.feedback-wall__canvas');
  const cards = [...wall.querySelectorAll('.feedback-note')];
  const desktop = matchMedia('(min-width: 701px) and (pointer: fine)');
  const guide = wall.querySelector('.feedback-wall__guide');
  const resetButton = wall.querySelector('.feedback-wall__reset');
  let topLayer = 1;
  const reset = () => cards.forEach(card => {
    card.style.removeProperty('--dx');
    card.style.removeProperty('--dy');
    card.style.removeProperty('z-index');
  });
  const sync = () => {
    reset();
    const draggable = desktop.matches;
    wall.toggleAttribute('data-draggable', draggable);
    guide.hidden = resetButton.hidden = !draggable;
    cards.forEach(card => {
      if (draggable) {
        card.tabIndex = 0;
        card.setAttribute('aria-describedby', guide.id);
      } else {
        card.removeAttribute('tabindex');
        card.removeAttribute('aria-describedby');
      }
    });
  };
  // Keep the entire card inside the board, including its rotated edges.
  const move = (card, dx, dy) => {
    const box = card.getBoundingClientRect();
    const bounds = canvas.getBoundingClientRect();
    dx = Math.max(bounds.left - box.left, Math.min(dx, bounds.right - box.right));
    dy = Math.max(bounds.top - box.top, Math.min(dy, bounds.bottom - box.bottom));
    card.style.setProperty('--dx', `${(parseFloat(card.style.getPropertyValue('--dx')) || 0) + dx}px`);
    card.style.setProperty('--dy', `${(parseFloat(card.style.getPropertyValue('--dy')) || 0) + dy}px`);
    card.style.zIndex = String(++topLayer);
  };
  cards.forEach(card => {
    let drag;
    card.addEventListener('pointerdown', event => {
      if (!desktop.matches || event.button !== 0 || event.target.closest('a, button')) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
      card.setPointerCapture(event.pointerId);
      card.classList.add('is-dragging');
      card.style.zIndex = String(++topLayer);
    });
    card.addEventListener('pointermove', event => {
      if (!drag || drag.id !== event.pointerId) return;
      move(card, event.clientX - drag.x, event.clientY - drag.y);
      drag.x = event.clientX;
      drag.y = event.clientY;
    });
    const stop = () => { drag = null; card.classList.remove('is-dragging'); };
    card.addEventListener('lostpointercapture', stop);
    card.addEventListener('pointercancel', stop);
    card.addEventListener('pointerup', stop);
    card.addEventListener('keydown', event => {
      if (!desktop.matches) return;
      const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      if (event.key === 'Escape') { reset(); return; }
      const direction = directions[event.key];
      if (!direction) return;
      event.preventDefault();
      const step = event.shiftKey ? 30 : 10;
      move(card, direction[0] * step, direction[1] * step);
    });
  });
  resetButton.addEventListener('click', reset);
  desktop.addEventListener('change', sync);
  new ResizeObserver(reset).observe(canvas);
  sync();
}
