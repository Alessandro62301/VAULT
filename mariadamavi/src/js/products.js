import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Produtos: a conversa com a Maria aparece aos poucos e cada favo da colmeia revela a nossa foto no scroll,
// de baixo para cima, com a linha rosa do "scanner" na borda. A foto da Apple sobe e sai.
// Hexágono em pé com cantos arredondados, em pixels do favo (serve para o recorte e o contorno)
function hexPath(w, h, r) {
  const pts = [
    [w / 2, 0],
    [w, h / 4],
    [w, (3 * h) / 4],
    [w / 2, h],
    [0, (3 * h) / 4],
    [0, h / 4],
  ];
  const n = pts.length;
  const toward = (p, q, d) => {
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const len = Math.hypot(dx, dy);
    return [p[0] + (dx / len) * d, p[1] + (dy / len) * d];
  };
  let d = "";
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const cur = pts[i];
    const next = pts[(i + 1) % n];
    const a = toward(cur, prev, r);
    const b = toward(cur, next, r);
    d += `${i === 0 ? "M" : "L"}${a[0].toFixed(2)} ${a[1].toFixed(2)}Q${cur[0].toFixed(2)} ${cur[1].toFixed(2)} ${b[0].toFixed(2)} ${b[1].toFixed(2)}`;
  }
  return d + "Z";
}

export function initProducts() {
  const section = document.querySelector(".products");
  if (!section) return;

  const shape = new ResizeObserver((entries) => {
    entries.forEach(({ target, contentRect }) => {
      const { width: w, height: h } = contentRect;
      const d = hexPath(w, h, w * 0.07);
      target.style.clipPath = `path("${d}")`;
      target.style.borderRadius = "0";
      const svg = target.parentElement.querySelector(".cell__outline");
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      svg.querySelector("path").setAttribute("d", d);
    });
  });
  section.querySelectorAll(".cell__body").forEach((b) => shape.observe(b));
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // A conversa (estilo Direct) aparece mensagem por mensagem, com "digitando" antes das respostas da Maria
  const chat = section.querySelector(".chat");
  if (chat) {
    const msgs = [...chat.querySelectorAll(".msg")];
    const typing = chat.querySelector(".chat__typing");
    gsap.set(msgs, { autoAlpha: 0, y: 14, scale: 0.96 });
    const tl = gsap.timeline({ paused: true });
    msgs.forEach((m) => {
      const fromMaria = m.classList.contains("msg--maria");
      if (fromMaria) {
        tl.call(() => {
          m.before(typing);
          typing.classList.add("is-on");
        }).to({}, { duration: 0.9 });
        tl.call(() => {
          typing.classList.remove("is-on");
          typing.parentElement.appendChild(typing); // sai do meio do bloco, para o avatar cair na última mensagem
        });
      } else {
        tl.to({}, { duration: 0.5 });
      }
      tl.to(m, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.45,
        ease: "back.out(1.8)",
        transformOrigin: fromMaria ? "0% 100%" : "100% 100%",
      });
    });
    ScrollTrigger.create({ trigger: chat, start: "top 75%", once: true, onEnter: () => tl.play() });
  }

  section.querySelectorAll(".cell").forEach((card) => {
    const product = card.querySelector(".cell__product");
    const photo = card.querySelector(".cell__photo");
    const shade = card.querySelector(".cell__shade");
    const scan = card.querySelector(".cell__scan");

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: card, start: "top 82%", end: "top 30%", scrub: 0.5 },
    });

    // primeiro um respiro com a foto da Apple, depois a revelação
    tl.to({}, { duration: 0.25 })
      .set(scan, { opacity: 1 })
      .fromTo(photo, { clipPath: "inset(100% 0% 0% 0%)", scale: 1.12 }, { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 1 })
      .fromTo(scan, { top: "100%" }, { top: "0%", duration: 1 }, "<")
      .to(product, { yPercent: -18, scale: 0.92, autoAlpha: 0, duration: 0.8, ease: "power1.in" }, "<0.15")
      .to(shade, { opacity: 1, duration: 0.6 }, "<0.3")
      .set(scan, { opacity: 0 });
  });
}
