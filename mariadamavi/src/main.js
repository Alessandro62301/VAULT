import "./styles/fonts.css";
import "@fontsource/silkscreen/400.css";
import "@fontsource/silkscreen/700.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/nav.css";
import "./styles/whatsapp.css";
import "./styles/hero.css";
import "./styles/board.css";
import "./styles/products.css";
import "./styles/mac-guide.css";
import "./styles/mavibag.css";
import "./styles/journey.css";
import "./styles/footer.css";
import "./styles/closing.css";
import "./styles/collection.css";

import { initNav } from "./js/nav.js";
import { initTheme } from "./js/theme.js";
import { initHero } from "./js/hero.js";
import { initProducts } from "./js/products.js";
import { initMeasurement } from "./js/measurement.js";
import { initCollection } from "./js/collection.js";
import { initWhatsappLinks, initWhatsappFloat } from "./js/whatsapp.js";

initTheme();
initMeasurement();
initWhatsappLinks();
initWhatsappFloat();
initHero();
initProducts();
// Read initial scroll geometry only after the product panels have been hidden.
initNav();
// Load below-the-fold effects only when their section approaches the viewport.
function whenNear(selector, load, afterScroll = false) {
  const section = document.querySelector(selector);
  if (!section) return;
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    const run = () => load().catch(error => console.error('Não foi possível carregar a interação:', error));
    if (!afterScroll) { run(); return; }
    // ScrollTrigger's first refresh must not interrupt a native smooth anchor jump.
    let timer;
    const settled = () => { window.removeEventListener('scroll', postpone); run(); };
    const postpone = () => { clearTimeout(timer); timer = setTimeout(settled, 150); };
    window.addEventListener('scroll', postpone, { passive: true });
    postpone();
  }, { rootMargin: '250px' });
  observer.observe(section);
}
whenNear('.about', () => import('./js/board.js').then(module => module.initBoard()), true);
whenNear('.mavibag', () => import('./js/mavibag.js').then(module => module.initMavibag()), true);
whenNear('.journey', () => import('./js/journey.js').then(module => module.initJourney()), true);
whenNear('.collection', async () => initCollection());

// O MARIADAMAVI do rodapé ocupa a largura exata, como a impressão da bag
const wordmark = document.querySelector(".footer__wordmark");
if (wordmark) {
  const fit = () => {
    const child = wordmark.firstElementChild;
    const currentSize = parseFloat(getComputedStyle(child).fontSize);
    const currentWidth = child.getBoundingClientRect().width;
    if (currentWidth) wordmark.style.setProperty("--wordmark-size", `${Math.floor(currentSize * wordmark.clientWidth / currentWidth * 0.98)}px`);
  };
  whenNear('.footer', async () => {
    await document.fonts.ready;
    let frame;
    new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(fit); }).observe(wordmark.parentElement);
  });
}

document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
