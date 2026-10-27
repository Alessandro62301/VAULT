export function initNav() {
  const nav = document.querySelector(".nav");
  if (!nav) return;
  const toggle = nav.querySelector(".nav__toggle");
  const sheet = nav.querySelector(".nav__sheet");

  // Pílula ganha corpo quando a página sai do topo
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Menu do celular
  const setOpen = (open) => {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    sheet.inert = !open;
  };
  sheet.inert = true;
  toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
  sheet.addEventListener("click", (e) => {
    if (e.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      setOpen(false);
      toggle.focus();
    }
  });
  document.addEventListener("click", (e) => {
    if (nav.classList.contains("is-open") && !nav.contains(e.target)) setOpen(false);
  });
  window.matchMedia("(min-width: 981px)").addEventListener("change", (e) => {
    if (e.matches) setOpen(false);
  });

  // Marca o link da seção que está na tela
  const links = [...nav.querySelectorAll('a[href^="#"]')].filter((a) => a.getAttribute("href").length > 1);
  const sections = [...new Set(links.map((a) => a.getAttribute("href")))]
    .map((id) => document.querySelector(id))
    .filter(Boolean);

  const setCurrent = (id) => {
    links.forEach((a) => {
      if (a.getAttribute("href") === `#${id}`) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting);
      if (visible.length) setCurrent(visible[0].target.id);
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => observer.observe(s));
}
