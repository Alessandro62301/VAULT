"""Gera o mapa pixel art do "Como funciona" (estilo mapa de fases de videogame, desenho original).

Saídas:
  public/como-funciona/map-desktop.png  (320x180, ampliado no navegador com image-rendering: pixelated)
  public/como-funciona/map-mobile.png   (180x320)
  src/js/map-data.js                    (posições das fases e dos caminhos, em pixels do mapa)

Uso: <venv>/bin/python -I assets-src/map/generate_map.py
"""
import json
import math
import random
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[2]

# Paleta (inspirada nos mapas de 16 bits, cores próprias)
C = {
    "sea": (74, 168, 236),
    "sea_dark": (52, 136, 214),
    "wave": (220, 242, 255),
    "grass": (108, 200, 64),
    "grass_hi": (148, 226, 86),
    "grass_edge": (40, 128, 44),
    "cliff": (240, 168, 96),
    "cliff_stripe": (206, 128, 66),
    "cliff_hi": (255, 206, 140),
    "cliff_base": (150, 86, 40),
    "sand": (242, 214, 162),
    "sand_dot": (214, 176, 116),
    "path": (250, 232, 150),
    "path_edge": (176, 132, 70),
    "tree": (36, 112, 48),
    "tree_hi": (70, 160, 62),
    "tree_dark": (18, 72, 32),
}

LAYOUTS = {
    "desktop": {
        "size": (320, 180),
        "block": 4,
        "cliff": 10,
        "islands": [
            [(158, 48, 42, 26), (174, 64, 28, 18)],  # EUA
            [(68, 110, 60, 30), (156, 131, 92, 17), (266, 108, 44, 32)],  # Brasil: saída à esquerda, chegada à direita
            [(212, 76, 14, 10)],  # ilhota da viagem
            [(24, 34, 10, 7)], [(288, 32, 12, 8)],
        ],
        "sand": [(170, 64, 25, 14)],
        "forest": [(132, 130, 26, 10), (276, 100, 16, 12)],
        "plateaus": [(98, 92, 25, 15), (154, 42, 28, 16)],
        "rocks": [(174, 66, 20, 10)],
        "hills": [(40, 108), (82, 128), (176, 132), (254, 124)],
        "maria": [300, 116],
        "nodes": [
            ("conversa", 26, 102),
            ("contrato", 66, 92),
            ("pagamento", 108, 98),
            ("compra", 158, 44),
            ("porto", 184, 66),
            ("viagem", 212, 76),
            ("mavibag", 250, 96),
            ("casa", 282, 122),
        ],
        "segments": [
            ("conversa", "contrato", "land", [(44, 92)]),
            ("contrato", "pagamento", "land", [(88, 92)]),
            ("pagamento", "compra", "air", [(120, 50), (136, 30)]),
            ("compra", "porto", "land", [(172, 46)]),
            ("porto", "viagem", "sea", [(200, 68)]),
            ("viagem", "mavibag", "sea", [(234, 78)]),
            ("mavibag", "casa", "land", [(264, 118)]),
        ],
    },
    "mobile": {
        "size": (180, 320),
        "block": 4,
        "cliff": 9,
        "islands": [
            [(92, 60, 64, 40), (46, 44, 26, 20), (140, 84, 22, 16)],  # EUA
            [(100, 250, 66, 54), (146, 222, 26, 22), (52, 272, 22, 18)],  # Brasil
            [(40, 166, 14, 10)],
            [(150, 150, 8, 6)],
            [(160, 300, 7, 5)],
            [(16, 120, 7, 5)],
        ],
        "sand": [(92, 74, 42, 16)],
        "forest": [(150, 268, 16, 14), (110, 40, 22, 10)],
        "plateaus": [(56, 46, 28, 16), (118, 214, 30, 18)],
        "rocks": [(92, 76, 38, 12)],
        "hills": [(24, 60), (146, 94), (20, 250), (104, 300), (64, 206), (150, 28)],
        "nodes": [
            ("conversa", 140, 290),
            ("contrato", 154, 240),
            ("pagamento", 118, 212),
            ("compra", 62, 50),
            ("porto", 134, 84),
            ("viagem", 40, 162),
            ("mavibag", 52, 240),
            ("casa", 66, 280),
        ],
        "segments": [
            ("conversa", "contrato", "land", [(152, 270)]),
            ("contrato", "pagamento", "land", [(140, 214)]),
            ("pagamento", "compra", "air", [(160, 140), (40, 96)]),
            ("compra", "porto", "land", [(96, 52), (118, 82)]),
            ("porto", "viagem", "sea", [(96, 130)]),
            ("viagem", "mavibag", "sea", [(30, 204)]),
            ("mavibag", "casa", "land", [(48, 262)]),
        ],
    },
}


mobile = LAYOUTS["mobile"]
mobile["islands"] = [[(180 - x, y, rx, ry) for x, y, rx, ry in parts] for parts in mobile["islands"]]
for key in ("sand", "forest", "plateaus", "rocks"):
    mobile[key] = [(180 - x, y, rx, ry) for x, y, rx, ry in mobile[key]]
mobile["hills"] = [(180 - x - 13, y) for x, y in mobile["hills"]]
mobile["nodes"] = [(name, 180 - x, y) for name, x, y in mobile["nodes"]]
mobile["segments"] = [(a, b, kind, [(180 - x, y) for x, y in via]) for a, b, kind, via in mobile["segments"]]
mobile["maria"] = [138, 280]


def ellipse_mask(w, h, cx, cy, rx, ry):
    yy, xx = np.mgrid[0:h, 0:w]
    return ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1


def blocky(mask, block):
    """Deixa as bordas em degraus grandes, como nos mapas de 16 bits."""
    h, w = mask.shape
    small = mask[block // 2 :: block, block // 2 :: block]
    big = np.kron(small, np.ones((block, block), bool))[:h, :w]
    out = np.zeros_like(mask)
    out[: big.shape[0], : big.shape[1]] = big
    return out


def stamp_line(mask, pts, radius):
    h, w = mask.shape
    yy, xx = np.mgrid[0:h, 0:w]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        steps = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
        for t in np.linspace(0, 1, steps):
            x = x0 + (x1 - x0) * t
            y = y0 + (y1 - y0) * t
            x_lo, x_hi = int(max(0, x - radius - 1)), int(min(w, x + radius + 2))
            y_lo, y_hi = int(max(0, y - radius - 1)), int(min(h, y + radius + 2))
            sub = (xx[y_lo:y_hi, x_lo:x_hi] - x) ** 2 + (yy[y_lo:y_hi, x_lo:x_hi] - y) ** 2 <= radius**2
            mask[y_lo:y_hi, x_lo:x_hi] |= sub


def render(name, L):
    random.seed(7)
    w, h = L["size"]
    img = np.zeros((h, w, 3), np.uint8)
    img[:] = C["sea"]

    land = np.zeros((h, w), bool)
    for parts in L["islands"]:
        m = np.zeros((h, w), bool)
        for cx, cy, rx, ry in parts:
            m |= ellipse_mask(w, h, cx, cy, rx, ry)
        land |= blocky(m, L["block"])

    depth = L["cliff"]
    # penhasco: estende a terra para baixo
    cliff = np.zeros_like(land)
    for d in range(1, depth + 1):
        cliff[d:, :] |= land[:-d, :]
    cliff &= ~land

    # sombra na água, embaixo e à direita do penhasco
    solid = land | cliff
    shadow = np.zeros_like(solid)
    shadow[2:, 2:] |= solid[:-2, :-2]
    shadow &= ~solid
    img[shadow] = C["sea_dark"]

    # ondinhas brancas longe da costa
    far = ~ndimage.binary_dilation(solid, iterations=5)
    for _ in range(int(w * h / 260)):
        x, y = random.randrange(2, w - 4), random.randrange(2, h - 2)
        if far[y, x] and far[y, x + 3] and far[y - 1, x + 1]:
            img[y, x] = C["wave"]
            img[y - 1, x + 1] = C["wave"]
            img[y - 1, x + 2] = C["wave"]
            img[y, x + 3] = C["wave"]

    # penhasco com listras verticais, brilho no topo e base escura
    ys, xs = np.nonzero(cliff)
    for y, x in zip(ys, xs):
        above_land = y - 1 >= 0 and land[y - 1, x]
        below_cliff = y + 1 < h and cliff[y + 1, x]
        if above_land:
            img[y, x] = C["cliff_hi"]
        elif not below_cliff:
            img[y, x] = C["cliff_base"]
        elif x % 5 == 0:
            img[y, x] = C["cliff_stripe"]
        else:
            img[y, x] = C["cliff"]

    # topo verde com pontinhos claros e contorno escuro
    img[land] = C["grass"]
    for _ in range(int(land.sum() / 18)):
        ys_, xs_ = np.nonzero(land)
        i = random.randrange(len(ys_))
        img[ys_[i], xs_[i]] = C["grass_hi"]
    edge = land & ~ndimage.binary_erosion(land, iterations=1)
    img[edge] = C["grass_edge"]

    # planaltos: um degrau de terra mais alto, com penhasco curto embaixo
    pdepth = max(4, depth // 2)
    plateau_cliff = np.zeros_like(land)
    plateau = np.zeros_like(land)
    for cx, cy, rx, ry in L.get("plateaus", []):
        p = blocky(ellipse_mask(w, h, cx, cy, rx, ry), L["block"]) & ndimage.binary_erosion(land, iterations=3)
        pc = np.zeros_like(p)
        for d in range(1, pdepth + 1):
            pc[d:, :] |= p[:-d, :]
        pc &= ~p & land
        plateau |= p
        plateau_cliff |= pc
    ys, xs = np.nonzero(plateau_cliff)
    for y, x in zip(ys, xs):
        if plateau[y - 1, x]:
            img[y, x] = C["cliff_hi"]
        elif not plateau_cliff[min(h - 1, y + 1), x]:
            img[y, x] = C["cliff_base"]
        elif x % 5 == 0:
            img[y, x] = C["cliff_stripe"]
        else:
            img[y, x] = C["cliff"]
    p_edge = plateau & ~ndimage.binary_erosion(plateau, iterations=1)
    img[plateau & ~p_edge] = C["grass_hi"]
    img[p_edge] = C["grass_edge"]

    # areia no EUA
    sand_mask = np.zeros_like(land)
    for cx, cy, rx, ry in L["sand"]:
        s = blocky(ellipse_mask(w, h, cx, cy, rx, ry), 2) & ndimage.binary_erosion(land, iterations=2)
        img[s] = C["sand"]
        sand_mask |= s
        sy, sx = np.nonzero(s)
        for i in random.sample(range(len(sy)), max(1, len(sy) // 14)):
            img[sy[i], sx[i]] = C["sand_dot"]

    nodes = {n: (x, y) for n, x, y in L["nodes"]}

    # caminhos de terra
    path = np.zeros_like(land)
    path_core = np.zeros_like(land)
    for a, b, kind, via in L["segments"]:
        if kind != "land":
            continue
        pts = [nodes[a], *via, nodes[b]]
        stamp_line(path, pts, 2.6)
        stamp_line(path_core, pts, 1.6)
    img[path & ~path_core] = C["path_edge"]
    img[path_core] = C["path"]
    ladder = path & plateau_cliff
    ly, lx = np.nonzero(ladder)
    for y, x in zip(ly, lx):
        img[y, x] = C["path_edge"] if y % 2 == 0 else C["cliff_base"]

    # pedras marrons na areia
    rock_sprite = ["..rr..", ".rRRr.", "rRrrrd", "rrrrdd", ".dddd."]
    sand_area = np.zeros_like(land)
    for cx, cy, rx, ry in L.get("rocks", []):
        sand_area |= ellipse_mask(w, h, cx, cy, rx, ry)
    keep = ndimage.binary_dilation(path, iterations=3)
    for nx, ny in [(x, y) for _, x, y in L["nodes"]]:
        keep |= ellipse_mask(w, h, nx, ny, 9, 9)
    placed = []
    for _ in range(400):
        tx, ty = random.randrange(0, w - 6), random.randrange(0, h - 5)
        if not (sand_area[ty : ty + 5, tx : tx + 6] & sand_mask[ty : ty + 5, tx : tx + 6]).all():
            continue
        if keep[ty : ty + 5, tx : tx + 6].any() or any(abs(tx - px) < 9 and abs(ty - py) < 7 for px, py in placed):
            continue
        placed.append((tx, ty))
        if len(placed) > 14:
            break
        for j, row in enumerate(rock_sprite):
            for i, ch in enumerate(row):
                if ch == "r":
                    img[ty + j, tx + i] = (150, 100, 66)
                elif ch == "R":
                    img[ty + j, tx + i] = (196, 146, 102)
                elif ch == "d":
                    img[ty + j, tx + i] = (104, 64, 40)

    # morrinhos verdes
    hill = [
        "....kkkkk....",
        "..kkgHHggkk..",
        ".kgHHHgggggk.",
        ".kgHHggggggk.",
        "kgHggggggggk.",
        "kgggggggggggk",
        "kggggggggggdk",
        "kkkkkkkkkkkkk",
    ]
    for hx, hy in L.get("hills", []):
        if keep[hy : hy + 8, hx : hx + 13].any() or not land[hy : hy + 8, hx : hx + 13].all():
            continue
        for j, row in enumerate(hill):
            for i, ch in enumerate(row):
                if 0 <= hy + j < h and 0 <= hx + i < w and land[hy + j, hx + i]:
                    if ch == "g":
                        img[hy + j, hx + i] = (88, 184, 60)
                    elif ch == "H":
                        img[hy + j, hx + i] = C["grass_hi"]
                    elif ch == "k":
                        img[hy + j, hx + i] = C["grass_edge"]
                    elif ch == "d":
                        img[hy + j, hx + i] = (60, 150, 52)

    # árvores (longe dos caminhos e das fases)
    keep_clear = ndimage.binary_dilation(path, iterations=4)
    for nx, ny in nodes.values():
        keep_clear |= ellipse_mask(w, h, nx, ny, 9, 9)
    inner = ndimage.binary_erosion(land, iterations=4)
    tree_sprite = [
        "..ooo..",
        ".oHHoo.",
        "oHHooox",
        "oHoooox",
        ".ooooxx",
        "..xxx..",
    ]
    for cx, cy, rx, ry in L["forest"]:
        for _ in range(int(rx * ry / 6)):
            tx = int(cx + random.uniform(-rx, rx))
            ty = int(cy + random.uniform(-ry, ry))
            if not (0 <= tx < w - 7 and 0 <= ty < h - 6):
                continue
            if ((tx - cx) / rx) ** 2 + ((ty - cy) / ry) ** 2 > 1:
                continue
            if not inner[ty + 3, tx + 3] or keep_clear[ty : ty + 6, tx : tx + 7].any():
                continue
            for j, row in enumerate(tree_sprite):
                for i, ch in enumerate(row):
                    if ch == "o":
                        img[ty + j, tx + i] = C["tree"]
                    elif ch == "H":
                        img[ty + j, tx + i] = C["tree_hi"]
                    elif ch == "x":
                        img[ty + j, tx + i] = C["tree_dark"]

    out_png = ROOT / "public" / "como-funciona" / f"map-{name}.png"
    Image.fromarray(img).save(out_png, optimize=True)

    segments = [
        {"from": a, "to": b, "type": kind, "points": [list(nodes[a]), *[list(p) for p in via], list(nodes[b])]}
        for a, b, kind, via in L["segments"]
    ]
    return {"w": w, "h": h, "nodes": {k: list(v) for k, v in nodes.items()}, "segments": segments, "maria": L["maria"]}


def main():
    data = {name: render(name, L) for name, L in LAYOUTS.items()}
    js = (
        "// Gerado por assets-src/map/generate_map.py: posições em pixels do mapa (não editar à mão)\n"
        f"export const MAP = {json.dumps(data, ensure_ascii=False)};\n"
    )
    (ROOT / "src" / "js" / "map-data.js").write_text(js)
    print("ok", {k: (v["w"], v["h"]) for k, v in data.items()})


if __name__ == "__main__":
    main()
