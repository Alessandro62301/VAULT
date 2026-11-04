// Google Analytics 4: só carrega a tag depois de autorização para medição.
import { ANALYTICS_HOSTS, loadWeSalesTracking } from './wesales.js';
const MEASUREMENT_ID = 'G-KD86VF99WL';
const CONSENT_KEY = 'mavi-analytics-consent';
const FIELDS = {
  whatsapp_click: ['origin', 'section'],
  product_select: ['product'],
  configuration_change: ['option'],
  video_start: [],
  upgrade_step: ['step'],
  upgrade_whatsapp: ['product', 'condition'],
  lead_form_open: ['section'],
};

let analyticsAllowed = false;
let tagLoaded = false;
let googleTagPolicy;

export function trackEvent(event, properties = {}, target = window) {
  const allowed = FIELDS[event];
  if (!allowed) return;
  const payload = { event };
  for (const key of allowed) {
    if (typeof properties[key] === 'string') payload[key] = properties[key].slice(0, 64);
  }

  if (typeof target.gtag === 'function') {
    if (!analyticsAllowed) return;
    const { event: eventName, ...parameters } = payload;
    target.gtag('event', eventName, parameters);
    return;
  }

  // Tests and local consumers can inspect sanitized events; the browser never
  // queues real visitor activity before consent is granted.
  if (typeof window !== 'undefined' && target === window) return;
  target.dataLayer = target.dataLayer || [];
  if (typeof target.dataLayer.push === 'function') target.dataLayer.push(payload);
}

function loadGoogleTag() {
  if (tagLoaded || !ANALYTICS_HOSTS.has(location.hostname)) return;
  tagLoaded = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  window.gtag('js', new Date());
  window.gtag('consent', 'update', { analytics_storage: 'granted' });
  window.gtag('config', MEASUREMENT_ID, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  const script = document.createElement('script');
  script.async = true;
  const googleTagUrl = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  try {
    if (window.trustedTypes && !googleTagPolicy) {
      googleTagPolicy = window.trustedTypes.createPolicy('mavi-google-tag', {
        createScriptURL: value => {
          if (value !== googleTagUrl) throw new TypeError('URL de medição não permitida.');
          return value;
        },
      });
    }
    script.src = googleTagPolicy ? googleTagPolicy.createScriptURL(googleTagUrl) : googleTagUrl;
    script.dataset.googleAnalytics = 'true';
    document.head.append(script);
  } catch (error) {
    // An analytics blocker or an outdated CSP must not interrupt the page.
    tagLoaded = false;
    console.warn('Não foi possível carregar a medição.', error);
  }
}

function getSavedConsent() {
  try {
    const saved = localStorage.getItem(CONSENT_KEY);
    return saved === 'granted' || saved === 'denied' ? saved : null;
  } catch {
    return null;
  }
}

function saveConsent(value) {
  try { localStorage.setItem(CONSENT_KEY, value); } catch {}
}

function clearAnalyticsCookies() {
  const names = document.cookie.split(';')
    .map(cookie => cookie.split('=')[0].trim())
    .filter(name => /^_(?:ga(?:_|$)|gid$)/.test(name));
  const domains = new Set([location.hostname, `.${location.hostname}`, 'mariadamavi.com.br', '.mariadamavi.com.br']);
  for (const name of names) {
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}; SameSite=Lax`;
    }
  }
}

function updateConsent(value) {
  analyticsAllowed = value === 'granted';
  saveConsent(value);

  if (analyticsAllowed) {
    loadGoogleTag();
    // Also updates an already-loaded tag after a previous refusal.
    if (tagLoaded) window.gtag('consent', 'update', { analytics_storage: 'granted' });
    try { loadWeSalesTracking('granted'); } catch (error) { console.warn('Rastreamento WeSales indisponível.', error); }
  } else if (tagLoaded) {
    window.gtag('consent', 'update', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  }
  if (!analyticsAllowed) clearAnalyticsCookies();
  // The vendor installs automatic listeners and has no documented teardown API.
  // Reload after saving refusal to remove them, without loading it again.
  if (!analyticsAllowed && document.querySelector('script[data-wesales-tracking]')) location.reload();
}

export function initMeasurement() {
  const banner = document.querySelector('[data-analytics-consent]');
  const acceptButton = banner?.querySelector('[data-analytics-accept]');
  const rejectButton = banner?.querySelector('[data-analytics-reject]');
  const settingsButton = document.querySelector('[data-analytics-settings]');
  const savedConsent = getSavedConsent();

  if (savedConsent === 'granted') updateConsent('granted');
  if (banner) banner.hidden = savedConsent !== null;

  acceptButton?.addEventListener('click', () => {
    updateConsent('granted');
    if (banner) banner.hidden = true;
  });
  rejectButton?.addEventListener('click', () => {
    updateConsent('denied');
    if (banner) banner.hidden = true;
  });
  settingsButton?.addEventListener('click', () => {
    if (banner) {
      banner.hidden = false;
      acceptButton?.focus();
    }
  });

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const url = new URL(link.href, location.href);
    if (url.hostname !== 'wa.me') return;
    trackEvent('whatsapp_click', {
      origin: link.dataset.wa || 'contact',
      section: link.closest('section[id]')?.id || (link.closest('footer') ? 'footer' : 'navigation'),
    });
  });
  document.querySelector('.hero__video')?.addEventListener('playing', () => trackEvent('video_start'), { once: true });
}
