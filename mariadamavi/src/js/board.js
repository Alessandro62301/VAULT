import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Quadro de avisos 3D: entra de baixo e se endireita, os itens são pregados um por um,
// inclina seguindo o mouse (cada item numa profundidade, em paralaxe) e dá para arrastar no desktop.
export function initBoard() {
  const section = document.querySelector(".about");
  if (!section) return;
  const board = section.querySelector(".board");
  const items = [...board.querySelectorAll(".pin-item")].filter((el) => getComputedStyle(el).display !== "none");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const desktop = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 721px)");

  const rotationOf = (el) => {
    const v = getComputedStyle(el).getPropertyValue(desktop.matches ? "--r" : "--mr") || getComputedStyle(el).getPropertyValue("--r");
    return parseFloat(v) || 0;
  };

  // Rotação e profundidade passam para o GSAP (ele também move no arrastar)
  items.forEach((el) => gsap.set(el, { rotation: rotationOf(el), z: Number(el.dataset.z || 0), transformPerspective: 0 }));

  if (reduced) return;

  // Entrada: o quadro sobe e se endireita; depois cada item cai e é pregado
  gsap.set(board, { rotationX: 22, y: 90, scale: 0.92, transformOrigin: "50% 100%" });
  items.forEach((el) => gsap.set(el, { autoAlpha: 0, y: -60, rotation: rotationOf(el) + 10, scale: 1.08 }));

  const tl = gsap.timeline({ paused: true });
  tl.to(board, { rotationX: 0, y: 0, scale: 1, duration: 1.1, ease: "expo.out" });
  items.forEach((el, i) => {
    tl.to(
      el,
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        rotation: rotationOf(el),
        duration: 0.55,
        ease: "back.out(1.6)",
      },
      0.45 + i * 0.09
    );
    const pin = el.querySelector(".pin");
    if (pin) tl.fromTo(pin, { scale: 1.8, y: -10 }, { scale: 1, y: 0, duration: 0.25, ease: "power3.in" }, 0.62 + i * 0.09);
  });

  ScrollTrigger.create({
    trigger: board,
    start: "top 78%",
    once: true,
    onEnter: () => tl.play(),
  });

  if (!desktop.matches) return;

  // Inclinação 3D seguindo o mouse
  const tiltX = gsap.quickTo(board, "rotationX", { duration: 0.9, ease: "power3.out" });
  const tiltY = gsap.quickTo(board, "rotationY", { duration: 0.9, ease: "power3.out" });
  section.addEventListener("pointermove", (e) => {
    if (dragging || tl.isActive()) return;
    const r = board.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    tiltY(px * 9);
    tiltX(-py * 7);
  });
  section.addEventListener("pointerleave", () => {
    tiltX(0);
    tiltY(0);
  });

  // Arrastar os itens pelo quadro
  board.classList.add("is-draggable");
  let dragging = null;
  let top = 10;
  items.forEach((el) => {
    el.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || e.target.closest("a, button")) return;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      el.style.zIndex = String(++top);
      const startX = e.clientX;
      const startY = e.clientY;
      const baseX = gsap.getProperty(el, "x");
      const baseY = gsap.getProperty(el, "y");
      const baseR = rotationOf(el);
      dragging = el;
      gsap.to(el, { scale: 1.05, z: Number(el.dataset.z || 0) + 40, rotation: baseR * 0.4, duration: 0.25, ease: "power2.out" });

      // Limites medidos sem transformação, para a inclinação 3D não distorcer
      const cork = board.querySelector(".board__cork");
      const minX = -el.offsetLeft;
      const maxX = cork.offsetWidth - el.offsetLeft - el.offsetWidth;
      const minY = -el.offsetTop;
      const maxY = cork.offsetHeight - el.offsetTop - el.offsetHeight;
      const clamp = gsap.utils.clamp;
      const move = (ev) => {
        gsap.set(el, {
          x: clamp(minX, maxX, baseX + ev.clientX - startX),
          y: clamp(minY, maxY, baseY + ev.clientY - startY),
        });
      };
      const up = () => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerup", up);
        el.removeEventListener("pointercancel", up);
        dragging = null;
        gsap.to(el, {
          scale: 1,
          z: Number(el.dataset.z || 0),
          rotation: baseR + gsap.utils.random(-3, 3),
          duration: 0.45,
          ease: "back.out(2)",
        });
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", up);
    });
  });
}
