import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initMavibag() {
  const section = document.querySelector(".mavibag");
  if (!section) return;
  const details = [...section.querySelectorAll(".mavibag__detail")];
  // Mantém um detalhe aberto de cada vez, inclusive em navegadores sem details[name].
  details.forEach((detail) => detail.addEventListener("toggle", () => {
    if (detail.open) details.forEach((other) => {
      if (other !== detail) other.open = false;
    });
    ScrollTrigger.refresh();
  }));

  const media = gsap.matchMedia();
  media.add("(prefers-reduced-motion: no-preference)", () => {
    gsap.fromTo(section.querySelector(".mavibag__photo img"),
      { scale: 1.08, yPercent: 2 },
      {
        scale: 1, yPercent: 0, ease: "none",
        scrollTrigger: {
          trigger: section.querySelector(".mavibag__visual"),
          start: "top bottom", end: "center center", scrub: 0.6,
        },
      },
    );
  });
}
