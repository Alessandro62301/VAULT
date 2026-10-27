// Tema claro/escuro: começa no claro e lembra a escolha de cada visitante.
const KEY = "mavi-theme";
const COLORS = { dark: "#0a0208", light: "#fcfaf9" };

export function initTheme() {
  const root = document.documentElement;
  const buttons = [...document.querySelectorAll(".theme-toggle")];
  const meta = document.querySelector('meta[name="theme-color"]');

  const apply = (theme) => {
    root.dataset.theme = theme;
    meta?.setAttribute("content", COLORS[theme]);
    buttons.forEach((b) => {
      const light = theme === "light";
      b.setAttribute("aria-pressed", String(light));
      b.setAttribute("aria-label", light ? "Ativar tema escuro" : "Ativar tema claro");
      const label = b.querySelector(".theme-toggle__label");
      if (label) label.textContent = light ? "Tema escuro" : "Tema claro";
    });
  };

  apply(root.dataset.theme === "dark" ? "dark" : "light");

  buttons.forEach((b) =>
    b.addEventListener("click", () => {
      const next = root.dataset.theme === "light" ? "dark" : "light";
      apply(next);
      try {
        localStorage.setItem(KEY, next);
      } catch (e) {}
    })
  );
}
