// Fila local para uma futura integração de analytics. Não carrega serviços,
// envia requisições, cria cookies ou armazena mensagens/identificadores pessoais.
const FIELDS = {
  whatsapp_click: ['origin', 'section'],
  product_select: ['product'],
  configuration_change: ['option'],
  video_start: [],
};

export function trackEvent(event, properties = {}, target = window) {
  const allowed = FIELDS[event];
  if (!allowed) return;
  const payload = { event };
  for (const key of allowed) {
    if (typeof properties[key] === 'string') payload[key] = properties[key].slice(0, 64);
  }
  target.dataLayer = target.dataLayer || [];
  if (typeof target.dataLayer.push === 'function') target.dataLayer.push(payload);
}

export function initMeasurement() {
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
