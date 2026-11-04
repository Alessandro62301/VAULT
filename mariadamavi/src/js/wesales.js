export const WESALES_TRACKING_ID = 'tk_eefbffecfd284717b2666037f750c00c';
export const WESALES_TRACKING_URL = 'https://link.msgsndr.com/js/external-tracking.js';
export const WESALES_EMBED_URL = 'https://link.msgsndr.com/js/form_embed.js';
export const ANALYTICS_HOSTS = new Set(['mariadamavi.com.br', 'www.mariadamavi.com.br']);
const scriptURLs = new Set([WESALES_TRACKING_URL, WESALES_EMBED_URL]);
let policy;

// No default policy: only these two exact vendor script URLs are trusted.
export function setWeSalesScriptURL(script, url, browser = window) {
  if (!scriptURLs.has(url)) throw new TypeError('Script WeSales não permitido.');
  if (browser.trustedTypes && !policy) {
    policy = browser.trustedTypes.createPolicy('mavi-wesales', {
      createScriptURL(value) {
        if (!scriptURLs.has(value)) throw new TypeError('Script WeSales não permitido.');
        return value;
      },
    });
  }
  script.src = policy ? policy.createScriptURL(url) : url;
}

export function loadWeSalesTracking(consent, browser = window) {
  if (consent !== 'granted' || !ANALYTICS_HOSTS.has(browser.location.hostname)) return false;
  if (browser.document.querySelector('script[data-wesales-tracking]')) return true;
  const script = browser.document.createElement('script');
  script.async = true;
  script.dataset.wesalesTracking = 'true';
  script.dataset.trackingId = WESALES_TRACKING_ID;
  setWeSalesScriptURL(script, WESALES_TRACKING_URL, browser);
  script.addEventListener('error', () => { script.remove(); console.warn('Rastreamento WeSales indisponível.'); }, { once: true });
  browser.document.head.append(script);
  return true;
}
