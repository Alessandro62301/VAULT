import { trackEvent } from './measurement.js';

export function initProducts() {
  const section = document.querySelector('.products');
  if (!section) return;
  const picker = section.querySelector('.product-picker');
  const tabs = [...picker.querySelectorAll('[data-product]')];
  const panels = [...section.querySelectorAll('[data-product-panel]')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 720px)');
  let active = 0;
  // Without JavaScript, all products and their WhatsApp links remain visible.
  picker.hidden = false;
  picker.setAttribute('role', 'tablist');
  const orient = () => picker.setAttribute('aria-orientation', mobile.matches ? 'horizontal' : 'vertical');
  orient();
  mobile.addEventListener('change', orient);
  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panels[index].id);
    panels[index].setAttribute('role', 'tabpanel');
    panels[index].setAttribute('aria-labelledby', tab.id);
    panels[index].tabIndex = 0;
  });
  function select(index, animate = true) {
    if (animate && index !== active) trackEvent('product_select', { product: tabs[index].dataset.product });
    active = index;
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    const image = panels[index].querySelector('.product-display__image');
    const info = panels[index].querySelector('.product-display__info');
    if (animate) for (const element of [image, info]) element.getAnimations().forEach(animation => animation.cancel());
    if (animate && !reduced.matches) {
      image.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 500, easing: 'cubic-bezier(.16,1,.3,1)' });
      info.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 350, easing: 'ease-out' });
    }
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => { if (i !== active) select(i); });
    tab.addEventListener('keydown', (event) => {
      const next = mobile.matches ? 'ArrowRight' : 'ArrowDown';
      const prev = mobile.matches ? 'ArrowLeft' : 'ArrowUp';
      let index;
      if (event.key === next) index = (active + 1) % tabs.length;
      else if (event.key === prev) index = (active - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') index = 0;
      else if (event.key === 'End') index = tabs.length - 1;
      else return;
      event.preventDefault();
      select(index);
      tabs[index].focus({ preventScroll: true });
      if (mobile.matches) picker.scrollTo({ left: tabs[index].offsetLeft - picker.offsetLeft - 16, behavior: 'instant' });
    });
  });
  select(0, false);
  const chat = section.querySelector('.chat');
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    if (reduced.matches) return;
    chat.querySelectorAll('.msg').forEach((message, index) => message.animate(
      [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 400, delay: index * 160, fill: 'backwards', easing: 'ease-out' },
    ));
  }, { threshold: .15 });
  observer.observe(chat);
}
