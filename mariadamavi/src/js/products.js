import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { trackEvent } from './measurement.js';
gsap.registerPlugin(ScrollTrigger);

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
    gsap.killTweensOf([image, info]);
    gsap.set([image, info], { clearProps: 'transform,opacity,visibility' });
    if (animate && !reduced.matches) {
      gsap.fromTo(image, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
      gsap.fromTo(info, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
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
  const motion = gsap.matchMedia();
  motion.add('(prefers-reduced-motion: no-preference)', () => {
    const chat = section.querySelector('.chat');
    gsap.from(chat.querySelectorAll('.msg'), {
      opacity: 0, y: 8, duration: 0.4, stagger: 0.16, ease: 'power2.out',
      scrollTrigger: { trigger: chat, start: 'top 85%', once: true },
    });
  });
}
