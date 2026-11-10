import "../styles/mavi-quest.css";
import { MARIA_SPRITE, spriteURL } from "./pixel-sprites.js";

const KEY = "mavi-apple-quest-v1";
const HIDING_PLACES = [
  { id: "colecao", selector: "#colecao-mavi .collection__intro p", name: "Coleção Mavi", clue: "Onde as histórias ganham capa." },
  { id: "produtos", selector: "#produtos .products__lead", name: "Produtos", clue: "Onde você escolhe seu próximo Apple." },
  { id: "mavibag", selector: "#mavibag .mavibag__intro", name: "MaviBag", clue: "Perto da sacola rosa." },
  { id: "mapa", selector: "#como-funciona .journey__skip", name: "Mapa da jornada", clue: "No caminho da encomenda até sua casa." },
  { id: "faq", selector: "#faq .closing-intro", name: "Perguntas frequentes", clue: "Onde a Mavi responde suas perguntas." },
];

const APPLE = [
  ".......gg...", "......ggg...", ".....hg.....", "..RR.h.RR...",
  ".RppRRRRRR..", ".RpRRRRRRRR.", ".RRRRRRRRRR.", ".RRRRRRRRRR.",
  "..RRRRRRRR..", "..RRRRRRRR..", "...RR..RR...",
];

const CHEST = [
  "....kkkkkkkkkkkk....", "...kyyyyyyyyyyyyk...", "..kyyaaaaaaaayyaak..",
  ".kyyyaaaaaaaayyyaak.", ".kyyyaaaaaaaayyyaak.",
  ".kyyyaaaaaaaayyyaak.", ".kkkkkkkkkkkkkkkkkk.", ".kyyyyyyyyyyyyyyyyk.",
  ".kyaaaaaayyaaayaaak.", ".kyaaaaayyyyaayaaak.", ".kyaaaaaykkyaayaaak.",
  ".kyaaaaayyyyaayaaak.", ".kyaaaaaaaaaaayaaak.", ".kyyyyyyyyyyyyyyyyk.",
  ".kkkkkkkkkkkkkkkkkk.", "...ssssssssssssss...",
];

function loadProgress() {
  let saved;
  try { saved = JSON.parse(localStorage.getItem(KEY)); } catch { /* A missão funciona sem armazenamento. */ }
  const ids = Array.isArray(saved?.found) ? saved.found : [];
  return {
    started: saved?.started === true,
    found: new Set(HIDING_PLACES.filter(place => ids.includes(place.id)).map(place => place.id)),
    opened: saved?.opened === true,
  };
}

export function initMaviQuest() {
  const quest = document.querySelector(".mavi-quest");
  const treasure = document.querySelector(".mavi-quest__treasure");
  if (!quest || !treasure) return;

  const places = HIDING_PLACES.map(place => ({ ...place, anchor: document.querySelector(place.selector) }));
  if (places.some(place => !place.anchor)) return;

  const state = loadProgress();
  const launcher = quest.querySelector(".mavi-quest__launcher");
  const label = quest.querySelector("[data-quest-label]");
  const panel = quest.querySelector(".mavi-quest__panel");
  const closePanel = quest.querySelector("[data-quest-close]");
  const dialogue = quest.querySelector("[data-quest-dialogue]");
  const meter = quest.querySelector("[data-quest-meter]");
  const clues = quest.querySelector(".mavi-quest__clues");
  const action = quest.querySelector("[data-quest-action]");
  const status = quest.querySelector("[data-quest-status]");
  const openButton = treasure.querySelector("[data-treasure-open]");
  const download = treasure.querySelector("[data-treasure-download]");
  const reward = treasure.querySelector(".mavi-quest__reward");
  const complete = () => state.found.size === places.length;

  function saveProgress() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...state, found: [...state.found] }));
    } catch { /* O progresso permanece nesta sessão. */ }
  }

  function setPanel(open) {
    panel.hidden = !open;
    launcher.setAttribute("aria-expanded", String(open));
    if (open) closePanel.focus({ preventScroll: true });
  }

  function renderTreasure() {
    treasure.classList.toggle("is-opened", state.opened);
    openButton.hidden = state.opened;
    download.hidden = !state.opened;
    reward.hidden = !state.opened;
    treasure.querySelector("[data-treasure-message]").textContent = state.opened
      ? "Seu presente é um papel de parede da aventura, em pixel art."
      : "Você encontrou todas as maçãs. Tem um presente te esperando!";
  }

  function showTreasure() {
    setPanel(false);
    renderTreasure();
    if (!treasure.open) treasure.showModal();
  }

  function renderProgress() {
    const count = state.found.size;
    label.textContent = complete() ? "Baú liberado!" : state.started ? `${count}/${places.length} maçãs` : "Tenho uma missão!";
    meter.querySelectorAll("span").forEach((slot, index) => slot.classList.toggle("is-found", index < count));
    clues.hidden = !state.started || complete();
    action.hidden = state.started && !complete();
    if (state.started) {
      dialogue.textContent = complete()
        ? "Você achou as cinco! Agora é só abrir o seu baú."
        : `Você encontrou ${count} de ${places.length} maçãs. Precisa de uma pista?`;
      action.textContent = "Ver meu baú";
    }
    for (const place of places) {
      const found = state.found.has(place.id);
      place.button.hidden = !state.started || found;
      place.clueItem.classList.toggle("is-found", found);
      place.clueItem.textContent = found ? `✓ ${place.name}` : place.clue;
    }
  }

  quest.style.setProperty("--mavi-portrait", spriteURL(MARIA_SPRITE));
  const appleSprite = spriteURL(APPLE);
  quest.style.setProperty("--mavi-apple", appleSprite);
  treasure.style.setProperty("--mavi-chest", spriteURL(CHEST));
  for (const place of places) {
    const slot = document.createElement("span");
    meter.append(slot);
    place.clueItem = document.createElement("li");
    clues.querySelector("ul").append(place.clueItem);

    const button = document.createElement("button");
    button.className = "mavi-quest-apple";
    button.type = "button";
    button.hidden = true;
    button.style.setProperty("--mavi-apple", appleSprite);
    button.setAttribute("aria-label", `Recolher maçã em ${place.name}`);
    button.addEventListener("click", event => {
      if (!state.started || state.found.has(place.id)) return;
      state.found.add(place.id);
      saveProgress();
      renderProgress();
      status.textContent = `Maçã encontrada. ${state.found.size} de ${places.length}.`;
      if (complete()) showTreasure();
      else if (event.detail === 0) launcher.focus({ preventScroll: true });
    });
    place.button = button;
    if (place.anchor.matches("a")) place.anchor.after(button);
    else place.anchor.append(button);
  }

  launcher.addEventListener("click", () => {
    if (complete()) showTreasure();
    else setPanel(panel.hidden);
  });
  closePanel.addEventListener("click", () => {
    setPanel(false);
    launcher.focus();
  });
  quest.addEventListener("keydown", event => {
    if (event.key === "Escape" && !panel.hidden) {
      setPanel(false);
      launcher.focus();
    }
  });
  action.addEventListener("click", () => {
    if (complete()) { showTreasure(); return; }
    state.started = true;
    saveProgress();
    setPanel(false);
    renderProgress();
    launcher.focus();
    status.textContent = "Missão aceita. Encontre cinco maçãs pela página.";
  });
  treasure.querySelector(".mavi-quest__treasure-close").addEventListener("click", () => treasure.close());
  treasure.addEventListener("close", () => launcher.focus({ preventScroll: true }));
  openButton.addEventListener("click", () => {
    state.opened = true;
    saveProgress();
    renderTreasure();
    download.focus();
  });

  renderProgress();
  quest.hidden = false;
}
