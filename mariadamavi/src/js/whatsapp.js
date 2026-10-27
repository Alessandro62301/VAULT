// Todo botão com data-wa="<origem>" vira um link do WhatsApp com mensagem pronta,
// para a Maria saber de qual parte do site a pessoa veio.
export const WHATSAPP_NUMBER = "5521920184210";

const MESSAGES = {
  nav: "Oi Maria! Vim pelo site e quero fazer uma encomenda.",
  hero: "Oi Maria! Vim pelo site e quero a minha MaviBag.",
  produtos: "Oi Maria! Vim pelo site e queria ajuda pra escolher o meu Apple.",
  "sob-medida": "Oi Maria! Quero encomendar um",
  produto: "Oi Maria! Vim pelo site e quero saber sobre",
  mavibag: "Oi Maria! Vi os detalhes da MaviBag no site e quero encomendar o meu Apple.",
  journey: "Oi Maria! Vi o mapa no site e quero começar a minha encomenda.",
  board: "Oi Maria! Vi o seu quadro no site e queria conversar.",
  menu: "Oi Maria! Vim pelo site e quero fazer uma encomenda.",
  float: "Oi Maria! Vim pelo site e queria tirar uma dúvida.",
  troca: "Oi Maria! Quero avaliar meu aparelho para entrar na troca. Posso te enviar o modelo e as fotos?",
  empresas: "Oi Maria! Quero uma proposta de Apple para minha empresa. Vou te passar o uso, a quantidade e o prazo que precisamos.",
  faq: "Oi Maria! Li as perguntas no site e queria tirar uma dúvida antes de encomendar.",
  footer: "Oi Maria! Vim pelo site e quero a minha MaviBag.",
  default: "Oi Maria! Vim pelo site.",
};

export function whatsappLink(origin = "default", extra = "") {
  const base = MESSAGES[origin] ?? MESSAGES.default;
  const text = extra ? `${base} ${extra}` : base;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function initWhatsappLinks(root = document) {
  root.querySelectorAll("[data-wa]").forEach((el) => {
    el.href = whatsappLink(el.dataset.wa, el.dataset.waExtra);
    el.target = "_blank";
    el.rel = "noopener";
  });
}

// O flutuante aparece quando o hero sai da tela e some quando o rodapé entra.
export function initWhatsappFloat() {
  const float = document.querySelector(".wa-float");
  const hero = document.querySelector("#inicio");
  const footer = document.querySelector(".footer");
  if (!float || !hero) return;

  let pastHero = false;
  let atFooter = false;
  const update = () => float.classList.toggle("is-visible", pastHero && !atFooter);

  new IntersectionObserver(([entry]) => {
    pastHero = !entry.isIntersecting;
    update();
  }, { threshold: 0, rootMargin: "-40% 0px 0px 0px" }).observe(hero);

  if (footer) {
    new IntersectionObserver(([entry]) => {
      atFooter = entry.isIntersecting;
      update();
    }, { threshold: 0.15 }).observe(footer);
  }

  // Na primeira vez que aparece no desktop, o rótulo abre sozinho por um instante.
  let greeted = false;
  new MutationObserver(() => {
    if (greeted || !float.classList.contains("is-visible")) return;
    greeted = true;
    float.classList.add("is-greeting");
    setTimeout(() => float.classList.remove("is-greeting"), 2600);
  }).observe(float, { attributes: true, attributeFilter: ["class"] });
}
