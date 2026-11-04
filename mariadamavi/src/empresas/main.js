import '../styles/fonts.css';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/footer.css';
import '../styles/whatsapp.css';
import '../styles/privacy.css';
import './style.css';
import { initTheme } from '../js/theme.js';
import { initMeasurement, trackEvent } from '../js/measurement.js';
import { initWhatsappLinks } from '../js/whatsapp.js';
import { setWeSalesScriptURL, WESALES_EMBED_URL } from '../js/wesales.js';

initTheme();
initMeasurement();
initWhatsappLinks();
document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
document.querySelectorAll('[data-lead-form-open]').forEach(link => {
  link.addEventListener('click', () => {
    trackEvent('lead_form_open', { section: 'empresas' });
    document.querySelector('#proposal-title').focus({ preventScroll: true });
  });
});

// Cross-origin form: an open is not a submission. Do not infer successful leads
// from iframe loads, resizes, or undocumented postMessage payloads.
const shell = document.querySelector('[data-enterprise-form]');
let embedRequested = false;
function loadEmbed() {
  if (embedRequested) return;
  embedRequested = true;
  const script = document.createElement('script');
  script.async = true;
  script.dataset.wesalesEmbed = 'true';
  setWeSalesScriptURL(script, WESALES_EMBED_URL);
  script.addEventListener('error', () => {
    embedRequested = false;
    script.remove();
    shell.dataset.embedError = 'true';
  }, { once: true });
  document.head.append(script);
}
// The provider's INLINE layout never uses minimize/close buttons. allowMinimize
// prevents its unused close-icon innerHTML sink under our existing Trusted Types.
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    loadEmbed();
  }, { rootMargin: '200px' });
  observer.observe(shell);
} else loadEmbed();

const mark = document.querySelector('.footer__wordmark');
const fit = () => {
  const child = mark.firstElementChild;
  const width = child.getBoundingClientRect().width;
  if (width) mark.style.setProperty('--wordmark-size', `${Math.floor(parseFloat(getComputedStyle(child).fontSize) * mark.clientWidth / width * .98)}px`);
};
document.fonts.ready.then(() => { fit(); new ResizeObserver(fit).observe(mark.parentElement); });
