const PALETTE = {
  h: "#613024", f: "#eeb58e", k: "#2a1020", W: "#fde9f2",
  p: "#ff5aa5", P: "#e8197f", s: "rgba(10,2,8,.28)", R: "#d8343c",
  w: "#ffffff", b: "#8fd3ff", y: "#ffd23f", g: "#7db83e", a: "#a45039",
};

export const MARIA_SPRITE = [
  "....y..y..y.....",
  "....yyyyyyy.....",
  "....kkPPkkk.....",
  "...khhhhhhhk....",
  "...khfffffhk....",
  "...khfkfkfhk....",
  "...khfffffhk....",
  "...khhfPffhhk...",
  "...khhfffhhk....",
  "....kkPPPkk.....",
  "...kfPPWPPfk....",
  "..kffPPWPPffk...",
  "..kfPPPWPPPfk...",
  "...kPPPWPPPk....",
  "...kPPWWWPPk....",
  "..kPPPWWWPPPk...",
  "..kPPWWWWWPPk...",
  ".kPPPWWWWWPPPk..",
  ".kkkkkkkkkkkkk..",
  ".....kk.kk......",
  "....sssssss.....",
];

export function spriteURL(rows) {
  const rects = rows.flatMap((row, y) => [...row].map((pixel, x) => {
    const color = PALETTE[pixel];
    return color ? `<rect x="${x}" y="${y}" width="1" height="1" fill="${color}"/>` : "";
  })).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${rows[0].length} ${rows.length}" shape-rendering="crispEdges">${rects}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
