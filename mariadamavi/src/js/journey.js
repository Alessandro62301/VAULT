import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { JOURNEYS, journeyMap } from "./journey-modes.js";
import { whatsappLink } from "./whatsapp.js";
import { MARIA_SPRITE, spriteURL } from "./pixel-sprites.js";

gsap.registerPlugin(ScrollTrigger);

// Sprites em pixel art, desenhados a partir de grades de caracteres
const SPRITES = {
  bag: [
    "..kkkkkkkk..",
    ".kWWWWWWWWk.",
    ".kWpWWpWPPk.",
    ".kWWpWWWPPk.",
    ".kpWWpWpPPk.",
    ".kWpWWWWPPk.",
    ".kWWWpWpPPk.",
    ".kpWWWWWPPk.",
    ".kWWpWpWPPk.",
    ".kWpWWWWPPk.",
    ".kWWWpWWPPk.",
    ".kWWWWWWWWk.",
    "..kkkkkkkk..",
    "...ssssss...",
  ],
  boat: [
    "kkkkkkkkkkkkkkkkkk",
    "kwwwwwwwwwwwwwwwwk",
    ".kRRRRRRRRRRRRRRk.",
    "..kRRRRRRRRRRRRk..",
    "...kkkkkkkkkkkk...",
    "b.b..b..b..b..b..b",
    ".b..b..b..b..b..b.",
  ],
  plane: [
    ".......kk.......",
    "......kwwk......",
    "k....kwwwwk....k",
    "kwkkkwwPPwwkkkwk",
    "kwwwwwwPPwwwwwwk",
    ".kkkkkwwwwkkkkk.",
    "......kwwk......",
    ".....kwyywk.....",
    ".....kkkkkk.....",
  ],
};

// Caminho completo em ordem, com o comprimento acumulado e onde fica cada fase
function buildRoute(data, phases) {
  const pts = [];
  const kinds = []; // tipo do trecho que começa em cada ponto
  data.segments.forEach((seg, i) => {
    seg.points.forEach((p, j) => {
      if (i > 0 && j === 0) {
        kinds[kinds.length - 1] = seg.type; // a junção é o começo deste trecho
        return;
      }
      pts.push(p);
      kinds.push(seg.type);
    });
  });
  const acc = [0];
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const stopAt = (node) => {
    const [nx, ny] = data.nodes[node];
    const i = pts.findIndex((p) => p[0] === nx && p[1] === ny);
    return acc[i];
  };
  return { pts, kinds, acc, total: acc[acc.length - 1], stops: phases.map((p) => stopAt(p.node)) };
}

function pointAt(route, d) {
  const { pts, acc, kinds } = route;
  let i = acc.findIndex((a) => a >= d);
  if (i <= 0) return { x: pts[0][0], y: pts[0][1], kind: kinds[0], angle: 0 };
  const t = (d - acc[i - 1]) / (acc[i] - acc[i - 1] || 1);
  const [x0, y0] = pts[i - 1];
  const [x1, y1] = pts[i];
  return {
    x: x0 + (x1 - x0) * t,
    y: y0 + (y1 - y0) * t,
    kind: kinds[i - 1],
    angle: (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI + 90,
  };
}

export function initJourney() {
  const section = document.querySelector(".journey");
  if (!section) return;
  const map = section.querySelector(".journey__map");
  const routesSvg = section.querySelector(".journey__routes");
  const hero = section.querySelector(".journey__hero");
  const maria = section.querySelector(".journey__maria");
  maria.style.backgroundImage = spriteURL(MARIA_SPRITE);
  let nodes = [...section.querySelectorAll(".journey__node")];
  let mode = 'encomenda';
  let phases = JOURNEYS[mode].phases;
  const dialog = section.querySelector(".journey__dialog");
  const dN = dialog.querySelector(".journey__dialog-n");
  const dT = dialog.querySelector(".journey__dialog-t");
  const dText = dialog.querySelector(".journey__dialog-text");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const simple = window.matchMedia("(max-width: 720px), (max-aspect-ratio: 4/5), (max-height: 740px), (prefers-reduced-motion: reduce)");
  const portrait = window.matchMedia("(max-width: 720px), (max-aspect-ratio: 4/5)");

  section.querySelector(".journey__sprite--bag").style.backgroundImage = spriteURL(SPRITES.bag);
  section.querySelector(".journey__sprite--boat").style.backgroundImage = spriteURL(SPRITES.boat);
  section.querySelector(".journey__sprite--plane").style.backgroundImage = spriteURL(SPRITES.plane);

  let data;
  let route;
  let phase = -1;
  let progress = 0;
  let typing = null;

  const layout = () => {
    data = journeyMap(mode, portrait.matches);
    route = buildRoute(data, phases);
    maria.style.left = `${data.maria[0] / data.w * 100}%`;
    maria.style.top = `${data.maria[1] / data.h * 100}%`;
    routesSvg.setAttribute("viewBox", `0 0 ${data.w} ${data.h}`);
    routesSvg.setAttribute("preserveAspectRatio", "none");
    routesSvg.replaceChildren(...data.segments
      .filter((s) => mode === 'pronta' || s.type !== "land")
      .map((s) => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.dataset.type = s.type;
        path.setAttribute('d', `M${s.points.map(p => p.join(' ')).join('L')}`);
        return path;
      }));
    nodes.forEach((n) => {
      const [x, y] = data.nodes[n.dataset.node];
      n.style.setProperty("--x", ((x / data.w) * 100).toFixed(3));
      n.style.setProperty("--y", ((y / data.h) * 100).toFixed(3));
    });
    render(progress);
  };

  const setPhase = (k) => {
    if (k === phase) return;
    phase = k;
    const p = phases[k];
    nodes.forEach((n, i) => {
      n.classList.toggle("is-done", i < k);
      n.classList.toggle("is-current", i === k);
    });
    dN.textContent = `Fase ${k + 1}/${phases.length}`;
    dT.textContent = p.title;
    section.classList.toggle("is-end", k === phases.length - 1);
    if (reduced.matches || simple.matches) {
      dText.textContent = p.text;
      return;
    }
    // texto "digitado" como nos jogos
    typing?.kill();
    const state = { n: 0 };
    typing = gsap.to(state, {
      n: p.text.length,
      duration: Math.min(1.1, p.text.length / 90),
      ease: "none",
      onUpdate: () => (dText.textContent = p.text.slice(0, Math.round(state.n))),
    });
  };

  // progresso 0..1 → distância no caminho: em cada intervalo, 35% parado na fase e 65% andando
  const render = (pr) => {
    progress = pr;
    const n = phases.length - 1;
    const seg = Math.min(n - 1, Math.floor(pr * n));
    const local = pr * n - seg;
    const DWELL = 0.35;
    let d;
    let arrived = seg;
    if (pr >= 1) {
      d = route.stops[n];
      arrived = n;
    } else if (local < DWELL) {
      d = route.stops[seg];
    } else {
      const t = gsap.parseEase("power1.inOut")((local - DWELL) / (1 - DWELL));
      d = route.stops[seg] + (route.stops[seg + 1] - route.stops[seg]) * t;
      if (t > 0.98) arrived = seg + 1;
    }
    const resting = local < DWELL || pr >= 1;
    const pt = pointAt(route, Math.min(d + 0.001, route.total));
    hero.style.transform = `translate(${(pt.x / data.w) * map.clientWidth}px, ${(pt.y / data.h) * map.clientHeight}px)`;
    hero.classList.toggle("is-sea", !resting && pt.kind === "sea");
    hero.classList.toggle("is-air", !resting && pt.kind === "air");
    hero.classList.toggle("is-resting", resting);
    hero.style.setProperty("--heading", `${pt.angle.toFixed(1)}deg`);
    setPhase(arrived);
    // no celular a caixa de diálogo vai para o lado oposto ao da MaviBag
    dialog.classList.toggle("is-top", portrait.matches && pt.y / data.h > 0.55);
  };

  const updateContent = () => {
    const content = JOURNEYS[mode];
    section.dataset.delivery = mode;
    section.querySelector('[data-journey-intro]').textContent = content.intro;
    nodes.forEach(node => node.remove());
    nodes = phases.map((p, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'journey__node';
      button.dataset.node = p.node;
      button.dataset.phase = String(i);
      button.setAttribute('aria-label', `Fase ${i + 1}: ${p.title}`);
      const sign = document.createElement('span');
      sign.className = 'journey__sign';
      const number = document.createElement('b');
      number.textContent = String(i + 1);
      sign.append(number, p.title);
      button.append(sign);
      map.append(button);
      return button;
    });
    const items = phases.map((p, i) => {
      const item = document.createElement('li');
      item.dataset.phase = String(i);
      const title = document.createElement('strong');
      title.textContent = `Fase ${i + 1} · ${p.title}`;
      item.append(title, ` ${p.text}`);
      return item;
    });
    section.querySelector('.journey__list').replaceChildren(...items);
    section.querySelectorAll('[data-wa="journey"]').forEach(link => {
      link.dataset.waExtra = content.message;
      link.href = whatsappLink('journey', content.message);
      link.textContent = `${content.cta} ↗`;
    });
    typing?.kill();
    phase = -1;
  };

  updateContent();
  layout();
  portrait.addEventListener("change", layout);
  new ResizeObserver(() => render(progress)).observe(map);

  let st;
  const syncMode = () => {
    st?.kill();
    st = null;
    typing?.kill();
    phase = -1;
    if (simple.matches) {
      render(1);
    } else {
      st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => render(self.progress),
      });
      render(st.progress);
    }
    ScrollTrigger.refresh();
  };
  simple.addEventListener("change", syncMode);
  syncMode();

  section.querySelector('.journey__switch').hidden = false;
  section.querySelector('.journey__switch').addEventListener('change', event => {
    const selected = event.target.value;
    if (!JOURNEYS[selected] || selected === mode) return;
    mode = selected;
    phases = JOURNEYS[mode].phases;
    progress = 0;
    updateContent();
    layout();
    syncMode();
    if (st) {
      window.scrollTo({ top: st.start + 1, behavior: 'instant' });
      render(0);
    }
  });

  // Delegação mantém os pontos clicáveis ao trocar a modalidade.
  map.addEventListener("click", event => {
      const n = event.target.closest('.journey__node');
      if (!n) return;
      if (!st) return;
      const k = Number(n.dataset.phase);
      const target = st.start + ((st.end - st.start) * (k / (phases.length - 1)) + 2);
      window.scrollTo({ top: target, behavior: "smooth" });
  });
}
