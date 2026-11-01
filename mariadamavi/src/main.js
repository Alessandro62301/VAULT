import "@fontsource-variable/archivo/standard.css";
import "@fontsource-variable/caveat/index.css";
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
import { initBoard } from "./js/board.js";
import { initProducts } from "./js/products.js";
import { initMavibag } from "./js/mavibag.js";
import { initJourney } from "./js/journey.js";
import { initMeasurement } from "./js/measurement.js";
import { initCollection } from "./js/collection.js";
import { initWhatsappLinks, initWhatsappFloat } from "./js/whatsapp.js";

initTheme();
initMeasurement();
initWhatsappLinks();
initNav();
initWhatsappFloat();
initHero();
initCollection();
initBoard();
initProducts();
initMavibag();
initJourney();

// O MARIADAMAVI do rodapé ocupa a largura exata, como a impressão da bag
const wordmark = document.querySelector(".footer__wordmark");
if (wordmark) {
  const fit = () => {
    wordmark.style.setProperty("--wordmark-size", "100px");
    const ratio = wordmark.clientWidth / wordmark.firstElementChild.getBoundingClientRect().width;
    wordmark.style.setProperty("--wordmark-size", `${Math.floor(100 * ratio * 0.98)}px`);
  };
  document.fonts.ready.then(fit);
  new ResizeObserver(fit).observe(wordmark.parentElement);
}

document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
