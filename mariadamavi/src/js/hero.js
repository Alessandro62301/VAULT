// Hero: o filme da linha da MaviBag toca sozinho em loop.
// A legenda da etapa acompanha o tempo do vídeo.
const FPS = 30;
const SPEED = 0.85; // um pouco mais lento, para dar tempo de ler cada etapa

// Etapas do storyboard, em frames do filme (film/STORYBOARD.md)
const BEATS = [
  { from: 0, to: 30 },
  { from: 30, to: 75 },
  { from: 75, to: 105 },
  { from: 105, to: 195 },
  { from: 195, to: 240 },
  { from: 240, to: 270 },
  { from: 270, to: 300 },
];

const SOURCES = {
  desktop: "/hero/hero-desktop.mp4",
  mobile: "/hero/hero-mobile.mp4",
};

export function initHero() {
  const hero = document.querySelector(".hero");
  if (!hero) return;
  const video = hero.querySelector(".hero__video");
  const captions = [...hero.querySelectorAll(".hero__caption-line")];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const portrait = window.matchMedia("(max-width: 860px), (max-aspect-ratio: 4/5)");

  let beat = -1;
  const setBeat = (k) => {
    if (k === beat) return;
    beat = k;
    captions.forEach((c, i) => c.classList.toggle("is-current", i === k));
  };
  setBeat(0);

  if (reduced.matches) return;

  // Escolhe o vídeo pelo formato da tela e troca se o formato mudar
  const pickSource = () => {
    const src = portrait.matches ? SOURCES.mobile : SOURCES.desktop;
    if (video.getAttribute("src") === src) return;
    video.src = src;
    video.poster = portrait.matches ? "/hero/poster-mobile.jpg" : "/hero/poster-desktop.jpg";
    video.load();
    play();
  };

  const play = () => {
    video.playbackRate = SPEED;
    const p = video.play();
    if (p) p.catch(() => {});
  };

  video.muted = true;
  video.addEventListener("playing", () => hero.classList.add("is-playing"), { once: true });
  video.addEventListener("loadedmetadata", () => (video.playbackRate = SPEED));
  pickSource();
  portrait.addEventListener("change", pickSource);

  // Sincroniza a legenda a cada quadro, só enquanto o hero está na tela
  let raf = 0;
  const sync = () => {
    const frame = Math.floor(video.currentTime * FPS);
    const k = BEATS.findIndex((b) => frame >= b.from && frame < b.to);
    setBeat(k === -1 ? BEATS.length - 1 : k);
  };
  const tick = () => {
    sync();
    raf = requestAnimationFrame(tick);
  };
  // timeupdate garante a troca mesmo quando o navegador segura o requestAnimationFrame
  video.addEventListener("timeupdate", sync);

  // Pausa quando o hero sai da tela ou a aba fica em segundo plano (poupa bateria)
  let onScreen = true;
  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    cancelAnimationFrame(raf);
    if (onScreen && !document.hidden) {
      play();
      raf = requestAnimationFrame(tick);
    } else video.pause();
  }).observe(hero);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) video.pause();
    else if (onScreen) play();
  });
}
