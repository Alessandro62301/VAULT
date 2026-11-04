import '@fontsource-variable/archivo/standard.css';
import '@fontsource-variable/caveat/index.css';
import './style.css';
import '../styles/privacy.css';
import './privacy.css';
import { initMeasurement } from '../js/measurement.js';
import { initWhatsappLinks, whatsappLink, WHATSAPP_NUMBER } from '../js/whatsapp.js';

initWhatsappLinks();
initMeasurement();
// The V2 tells this story through cards and film, so its messages name those sections.
const versionMessages = {
  journey: 'Oi Maria! Vim pelo site, conheci a experiência Mavi e quero começar a minha encomenda.',
  board: 'Oi Maria! Vim pelo site, vi seu unboxing e queria conversar sobre o meu próximo Apple.',
};
Object.entries(versionMessages).forEach(([origin, message]) => {
  document.querySelectorAll(`[data-wa="${origin}"]`).forEach(link => {
    link.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  });
});
document.querySelectorAll('svg:not(.svg-library)').forEach(icon => { icon.setAttribute('aria-hidden', 'true'); icon.setAttribute('focusable', 'false'); });
const journalSources = {
  '/instagram/macbook-air-ou-pro.jpg': 'https://www.instagram.com/mariadamavi/reel/DbAuf7Lxb5A/',
  '/instagram/nota-fiscal.jpg': 'https://www.instagram.com/mariadamavi/reel/DbLEEmVxH6i/',
  '/instagram/novidades.jpg': 'https://www.instagram.com/mariadamavi/p/DcLZrwskRyj/',
};
document.querySelectorAll('.journal-card').forEach(link => {
  const source = journalSources[link.querySelector('img').getAttribute('src')];
  if (source) link.href = source;
});
document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
function closeMenu(restoreFocus = false) {
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Abrir menu');
  mobileMenu.hidden = true;
  if (restoreFocus) menuToggle.focus();
}
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  mobileMenu.hidden = !open;
});
mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !mobileMenu.hidden) closeMenu(true); });
document.addEventListener('click', event => { if (!header.contains(event.target)) closeMenu(); });
matchMedia('(min-width: 901px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
const headerObserver = new IntersectionObserver(([entry]) => header.classList.toggle('is-scrolled', !entry.isIntersecting), { rootMargin: '-80px 0px 0px 0px' });
headerObserver.observe(document.querySelector('.hero'));

// Content stays visible if JavaScript or IntersectionObserver is unavailable.
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); revealObserver.unobserve(entry.target); }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('[data-reveal]').forEach(el => { el.classList.add('will-reveal'); revealObserver.observe(el); });
}

// Only the stock atmosphere film autoplays, silently, while visible.
// Source files and replacement instructions: public/v2/MEDIA-SOURCES.md.
const ambientVideo = document.querySelector('[data-ambient-video]');
const videoToggle = document.querySelector('[data-video-toggle]');
let manuallyPaused = false;
let filmVisible = false;
let manuallyStarted = false;
function updateVideoControl() {
  videoToggle.setAttribute('aria-label', ambientVideo.paused ? 'Reproduzir filme de referência' : 'Pausar filme de referência');
  videoToggle.querySelector('use').setAttribute('href', ambientVideo.paused ? '#play' : '#pause');
}
async function playAtmosphere() {
  if (!ambientVideo.getAttribute('src')) ambientVideo.src = ambientVideo.dataset.src;
  try { await ambientVideo.play(); } catch { updateVideoControl(); }
}
function syncAtmosphere() {
  if (filmVisible && !document.hidden && !document.querySelector('.unboxing-dialog').open && !manuallyPaused && (manuallyStarted || (!reducedMotion.matches && !navigator.connection?.saveData))) playAtmosphere();
  else ambientVideo.pause();
}
new IntersectionObserver(([entry]) => { filmVisible = entry.isIntersecting; syncAtmosphere(); }, { threshold: 0.12 }).observe(ambientVideo);
videoToggle.addEventListener('click', () => {
  if (ambientVideo.paused) { manuallyPaused = false; manuallyStarted = true; playAtmosphere(); }
  else { manuallyPaused = true; ambientVideo.pause(); }
});
ambientVideo.addEventListener('play', updateVideoControl);
ambientVideo.addEventListener('pause', updateVideoControl);
ambientVideo.addEventListener('error', () => {
  manuallyPaused = true;
  videoToggle.hidden = true;
  document.querySelector('.film-controls > span').textContent = 'IMAGEM DE REFERÊNCIA';
});
document.addEventListener('visibilitychange', syncAtmosphere);
reducedMotion.addEventListener('change', syncAtmosphere);

const products = {
  mac: { name: 'MacBook', image: 'macbook', title: 'Seu próximo MacBook.', kicker: 'PARA TIRAR IDEIAS DO PAPEL', description: 'Air ou Pro, a configuração que acompanha o seu trabalho. Vamos encontrar a sua?' },
  iphone: { name: 'iPhone', image: 'iphone', title: 'Um novo ponto de vista.', kicker: 'PARA VIVER CADA DETALHE', description: 'O iPhone que combina com a sua rotina. Me conta o que mais importa para você.' },
  ipad: { name: 'iPad', image: 'ipad', title: 'Espaço para imaginar.', kicker: 'PARA APRENDER, CRIAR E LEVAR', description: 'Para estudar, desenhar ou trabalhar de onde quiser. A gente escolhe o tamanho e o modelo juntos.' },
  watch: { name: 'Apple Watch', image: 'watch', title: 'No ritmo dos seus dias.', kicker: 'PARA ACOMPANHAR VOCÊ', description: 'Seu dia a dia, suas atividades e seus próximos passos. Vamos conversar sobre o seu Apple Watch.' },
  airpods: { name: 'AirPods', image: 'airpods', title: 'O seu mundo. Seu som.', kicker: 'PARA OUVIR O QUE IMPORTA', description: 'Música, chamadas e foco na rotina. Eu te ajudo a entender qual AirPods combina com você.' },
};
const tabs = [...document.querySelectorAll('[data-pick]')];
const panel = document.getElementById('picker-panel');
function selectProduct(tab) {
  const product = products[tab.dataset.pick];
  tabs.forEach(item => { item.setAttribute('aria-selected', String(item === tab)); item.tabIndex = item === tab ? 0 : -1; });
  panel.setAttribute('aria-labelledby', tab.id);
  const img = document.getElementById('picker-image');
  img.src = `/produtos/apple/${product.image}.webp`;
  img.alt = product.name;
  img.dataset.product = tab.dataset.pick;
  document.getElementById('picker-title').textContent = product.title;
  document.getElementById('picker-kicker').textContent = product.kicker;
  document.getElementById('picker-description').textContent = product.description;
  const cta = document.getElementById('picker-cta');
  cta.firstChild.textContent = `Conversar sobre ${product.name} `;
  cta.href = whatsappLink('produto', `${product.name}. Pode me ajudar a escolher?`);
  if (!reducedMotion.matches) img.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 350, easing: 'ease-out' });
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectProduct(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    tabs[next].focus();
    selectProduct(tabs[next]);
  });
});

const unboxingDialog = document.querySelector('.unboxing-dialog');
const unboxingVideo = unboxingDialog.querySelector('video');
const errorMessage = unboxingDialog.querySelector('.video-error');
const unboxingTrigger = document.querySelector('[data-open-unboxing]');
unboxingTrigger.addEventListener('click', async () => {
  ambientVideo.pause();
  unboxingDialog.showModal();
  document.body.classList.add('dialog-open');
  if (!unboxingVideo.getAttribute('src')) unboxingVideo.src = '/hero/maria-unboxing.mp4';
  try { await unboxingVideo.play(); } catch { /* Native controls allow a second playback attempt. */ }
});
unboxingVideo.addEventListener('error', () => { errorMessage.hidden = false; });
unboxingDialog.querySelector('.dialog-close').addEventListener('click', () => unboxingDialog.close());
unboxingDialog.addEventListener('click', event => { if (event.target === unboxingDialog) { const r = unboxingDialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) unboxingDialog.close(); } });
unboxingDialog.addEventListener('close', () => { unboxingVideo.pause(); document.body.classList.remove('dialog-open'); unboxingTrigger.focus({ preventScroll: true }); syncAtmosphere(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) unboxingVideo.pause(); });
