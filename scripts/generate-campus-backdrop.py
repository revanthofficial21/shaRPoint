#!/usr/bin/env python3
"""
Procedurally generate the landing-page hero backdrop.

WHY A GENERATOR RATHER THAN A HAND-WRITTEN SVG
The scene needs a few hundred stars, several hundred window panes, and dozens of
reflection streaks. Written by hand that is unmaintainable; generated, the whole
thing is one file you can re-tune. Everything is seeded, so the same seed always
produces the same image — a regenerated backdrop is never a surprise diff.

WHAT THIS CAN AND CANNOT DO
It can produce composition, palette, lighting logic and depth: the Milky Way
band, backlit tree canopies, warm/cool window grids, and the long vertical
reflections on wet paving that give the reference its character.

It cannot produce a photograph. The reference is a painted illustration with
individually rendered leaves, window mullions and glass. This is geometry,
gradients and blur — a stylised interpretation, not a reproduction.

Usage:  python3 scripts/generate-campus-backdrop.py
Writes: public/avatars/campus-night.svg
"""

import random
from pathlib import Path

W, H = 1600, 900
SEED = 20261021
HORIZON = 620          # where the ground meets the buildings
GROUND = 700           # where the plaza begins

rng = random.Random(SEED)
out = []
add = out.append


def f(v):
    """Trim float noise from the output."""
    return f"{v:.1f}".rstrip("0").rstrip(".")


def hsl(h, s, l, a=None):
    return f"hsl({f(h)} {f(s)}% {f(l)}%{'' if a is None else f' / {f(a)}'})"


# ── document ────────────────────────────────────────────────────────────────
add(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
    f'preserveAspectRatio="xMidYMid slice" width="{W}" height="{H}">')
add('<defs>')

# Sky: deep indigo overhead, warming to violet and magenta at the horizon.
add('<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">'
    '<stop offset="0%" stop-color="#080f2c"/>'
    '<stop offset="30%" stop-color="#141a55"/>'
    '<stop offset="55%" stop-color="#2e2170"/>'
    '<stop offset="74%" stop-color="#5a2f8f"/>'
    '<stop offset="88%" stop-color="#9a4a9e"/>'
    '<stop offset="100%" stop-color="#c86a9a"/>'
    '</linearGradient>')

# Warm glow the lit buildings throw upward into the haze.
add('<radialGradient id="cityglow" cx="50%" cy="72%" r="55%">'
    '<stop offset="0%" stop-color="#ffb46a" stop-opacity="0.30"/>'
    '<stop offset="45%" stop-color="#c66bb0" stop-opacity="0.16"/>'
    '<stop offset="100%" stop-color="#7a3f9e" stop-opacity="0"/>'
    '</radialGradient>')

# Milky Way core.
add('<linearGradient id="milky" x1="0" y1="0" x2="0.3" y2="1">'
    '<stop offset="0%" stop-color="#ffffff" stop-opacity="0.06"/>'
    '<stop offset="35%" stop-color="#e6d8ff" stop-opacity="0.30"/>'
    '<stop offset="70%" stop-color="#c9a6ff" stop-opacity="0.22"/>'
    '<stop offset="100%" stop-color="#9a6ad6" stop-opacity="0"/>'
    '</linearGradient>')

# Wet paving: bright where it catches the sky, darker as it comes forward.
add('<linearGradient id="paving" x1="0" y1="0" x2="0" y2="1">'
    '<stop offset="0%" stop-color="#6f7ad6"/>'
    '<stop offset="18%" stop-color="#4a4fa8"/>'
    '<stop offset="55%" stop-color="#2b2a72"/>'
    '<stop offset="100%" stop-color="#171a45"/>'
    '</linearGradient>')

add('<linearGradient id="facadeL" x1="0" y1="0" x2="1" y2="0">'
    '<stop offset="0%" stop-color="#232a5e"/>'
    '<stop offset="100%" stop-color="#333a78"/>'
    '</linearGradient>')
add('<linearGradient id="facadeR" x1="0" y1="0" x2="1" y2="0">'
    '<stop offset="0%" stop-color="#333a78"/>'
    '<stop offset="100%" stop-color="#222858"/>'
    '</linearGradient>')

# A reflection streak fades as it runs toward the viewer.
add('<linearGradient id="refl" x1="0" y1="0" x2="0" y2="1">'
    '<stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/>'
    '<stop offset="35%" stop-color="#ffffff" stop-opacity="0.18"/>'
    '<stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>'
    '</linearGradient>')

add('<linearGradient id="groundfall" x1="0" y1="0" x2="0" y2="1">'
    '<stop offset="0%" stop-color="#0b0e2c" stop-opacity="0"/>'
    '<stop offset="55%" stop-color="#0b0e2c" stop-opacity="0.18"/>'
    '<stop offset="100%" stop-color="#070a22" stop-opacity="0.42"/>'
    '</linearGradient>')

add('<filter id="blur18" x="-30%" y="-30%" width="160%" height="160%">'
    '<feGaussianBlur stdDeviation="18"/></filter>')
add('<filter id="blur9" x="-30%" y="-30%" width="160%" height="160%">'
    '<feGaussianBlur stdDeviation="9"/></filter>')
add('<filter id="blur3" x="-30%" y="-30%" width="160%" height="160%">'
    '<feGaussianBlur stdDeviation="3"/></filter>')
add('</defs>')

# ── sky ─────────────────────────────────────────────────────────────────────
add(f'<rect width="{W}" height="{H}" fill="url(#sky)"/>')

# ── milky way: a soft band, then density piled along it ─────────────────────
add('<g filter="url(#blur18)">')
for i in range(9):
    t = i / 8
    cx = 700 + t * 520
    cy = 40 + t * 470
    add(f'<ellipse cx="{f(cx)}" cy="{f(cy)}" rx="{f(150 - t * 40)}" '
        f'ry="{f(96 - t * 26)}" fill="url(#milky)" '
        f'transform="rotate({f(52 + t * 6)} {f(cx)} {f(cy)})"/>')
add('</g>')

# stars, denser inside the band
for _ in range(340):
    band = rng.random() < 0.55
    if band:
        t = rng.random()
        cx = 700 + t * 520 + rng.gauss(0, 90)
        cy = 40 + t * 470 + rng.gauss(0, 62)
    else:
        cx, cy = rng.uniform(0, W), rng.uniform(0, 470)
    if not (0 <= cx <= W and 0 <= cy <= 480):
        continue
    r = rng.choice([0.7, 0.9, 1.0, 1.3, 1.6, 2.1])
    a = rng.uniform(0.22, 0.95)
    tint = rng.choice(["#ffffff", "#ffffff", "#e8e2ff", "#cfe0ff", "#ffe9d6"])
    add(f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}" fill="{tint}" opacity="{f(a)}"/>')

# the brightest handful get a halo
for _ in range(16):
    t = rng.random()
    cx = 700 + t * 520 + rng.gauss(0, 70)
    cy = 40 + t * 470 + rng.gauss(0, 50)
    add(f'<circle cx="{f(cx)}" cy="{f(cy)}" r="3.4" fill="#ffffff" opacity="0.85" filter="url(#blur3)"/>')

# ── violet clouds near the horizon ──────────────────────────────────────────
add('<g filter="url(#blur18)">')
for _ in range(11):
    cx = rng.uniform(0, W)
    cy = rng.uniform(300, 500)
    add(f'<ellipse cx="{f(cx)}" cy="{f(cy)}" rx="{f(rng.uniform(90, 230))}" '
        f'ry="{f(rng.uniform(20, 44))}" fill="{hsl(rng.uniform(280, 315), 62, 58, rng.uniform(0.10, 0.26))}"/>')
add('</g>')

add(f'<rect width="{W}" height="{H}" fill="url(#cityglow)"/>')

# atmospheric haze: the horizon should never be a hard line
add('<g filter="url(#blur18)">'
    f'<ellipse cx="{W // 2}" cy="{HORIZON - 30}" rx="{W * 0.72}" ry="86" '
    f'fill="{hsl(268, 58, 46, 0.30)}"/>'
    f'<ellipse cx="{W // 2}" cy="{HORIZON + 6}" rx="{W * 0.6}" ry="46" '
    f'fill="{hsl(30, 80, 62, 0.16)}"/>'
    '</g>')


# ── buildings ───────────────────────────────────────────────────────────────
def window_grid(x, y, w, h, cols, rows, warm_bias, tag):
    """A grid of panes: warm where lit, cool where it is reflecting sky."""
    cw, ch = w / cols, h / rows
    for r in range(rows):
        for c in range(cols):
            if rng.random() > 0.80:
                continue
            warm = rng.random() < warm_bias
            px = x + c * cw + cw * 0.16
            py = y + r * ch + ch * 0.20
            pw, ph = cw * 0.68, ch * 0.56
            if warm:
                fill = hsl(rng.uniform(30, 44), 96, rng.uniform(58, 74), rng.uniform(0.55, 0.95))
            else:
                fill = hsl(rng.uniform(196, 214), 78, rng.uniform(48, 68), rng.uniform(0.30, 0.62))
            add(f'<rect x="{f(px)}" y="{f(py)}" width="{f(pw)}" height="{f(ph)}" '
                f'rx="1.5" fill="{fill}"/>')
    # a faint mullion grid over the whole face
    add(f'<g stroke="#0d1130" stroke-width="0.6" opacity="0.16">')
    for c in range(1, cols):
        add(f'<line x1="{f(x + c * cw)}" y1="{f(y)}" x2="{f(x + c * cw)}" y2="{f(y + h)}"/>')
    for r in range(1, rows):
        add(f'<line x1="{f(x)}" y1="{f(y + r * ch)}" x2="{f(x + w)}" y2="{f(y + r * ch)}"/>')
    add('</g>')


# parapet setbacks, so the roofline is not a single flat bar
for bx, by, bw, bh in [(-30, 250, 250, 20), (196, 330, 200, 16),
                       (380, 292, 330, 18), (700, 330, 300, 16),
                       (980, 286, 290, 20), (1250, 352, 380, 16)]:
    add(f'<rect x="{bx + 10}" y="{by - bh}" width="{bw - 20}" height="{bh}" fill="#1a1f4a"/>')

# left block, receding
add(f'<rect x="-30" y="250" width="250" height="{HORIZON - 250}" fill="url(#facadeL)"/>')
window_grid(-18, 276, 226, 300, 5, 7, 0.86, "L1")
add(f'<rect x="196" y="330" width="200" height="{HORIZON - 330}" fill="url(#facadeL)"/>')
window_grid(208, 352, 176, 232, 4, 6, 0.80, "L2")

# centre block with the glass curtain wall
add(f'<rect x="380" y="292" width="330" height="{HORIZON - 292}" fill="#2b3169"/>')
window_grid(396, 316, 298, 160, 6, 4, 0.72, "C1")
# the glass wall itself: cool, with a bright band
add(f'<rect x="404" y="486" width="282" height="130" fill="{hsl(205, 82, 62, 0.5)}"/>')
add(f'<rect x="404" y="486" width="282" height="130" fill="url(#refl)" opacity="0.35"/>')
add('<g stroke="#101540" stroke-width="1" opacity="0.6">')
for c in range(1, 7):
    add(f'<line x1="{f(404 + c * 47)}" y1="486" x2="{f(404 + c * 47)}" y2="616"/>')
add('</g>')

# right block, the largest
add(f'<rect x="700" y="330" width="300" height="{HORIZON - 330}" fill="#2a3066"/>')
window_grid(716, 352, 268, 180, 5, 5, 0.62, "R1")
add(f'<rect x="980" y="286" width="290" height="{HORIZON - 286}" fill="url(#facadeR)"/>')
window_grid(996, 310, 258, 262, 6, 7, 0.58, "R2")
add(f'<rect x="1250" y="352" width="380" height="{HORIZON - 352}" fill="url(#facadeR)"/>')
window_grid(1266, 376, 348, 210, 7, 6, 0.54, "R3")

# lit rooflines
add('<g filter="url(#blur3)">')
for x, y, w in [(-30, 248, 250), (196, 328, 200), (380, 290, 330),
                (700, 328, 300), (980, 284, 290), (1250, 350, 380)]:
    add(f'<rect x="{x}" y="{y}" width="{w}" height="2.6" fill="#7fa8ff" opacity="0.75"/>')
add('</g>')

# the entrance: steps and a pool of warm light
add(f'<rect x="470" y="{HORIZON}" width="150" height="14" fill="#2a2f66"/>')
add(f'<rect x="456" y="{HORIZON + 14}" width="178" height="14" fill="#262b60"/>')
add(f'<rect x="442" y="{HORIZON + 28}" width="206" height="14" fill="#222758"/>')
add('<g filter="url(#blur9)">'
    f'<ellipse cx="545" cy="{HORIZON - 6}" rx="96" ry="34" fill="#ffc074" opacity="0.42"/>'
    '</g>')

# ── trees: canopy clusters with warm rim light ──────────────────────────────
TREES = [
    (110, 560, 92, 0.0), (300, 592, 74, 0.0), (232, 520, 60, 0.0),
    (648, 566, 66, 0.0), (846, 588, 78, 0.0), (1046, 566, 70, 0.0),
    (1240, 600, 84, 0.0), (1452, 552, 88, 0.0), (1560, 604, 70, 0.0),
]
add('<g>')
for tx, ty, r, _ in TREES:
    add(f'<rect x="{f(tx - 4)}" y="{f(ty)}" width="8" height="{f(HORIZON - ty + 40)}" fill="#141a3d"/>')
    # canopy mass: dark teal-olive, denser and overlapping so it reads as foliage
    add('<g fill="#12302f">')
    for _ in range(14):
        ox = rng.gauss(0, r * 0.44)
        oy = rng.gauss(0, r * 0.34)
        rr = r * rng.uniform(0.34, 0.62)
        add(f'<circle cx="{f(tx + ox)}" cy="{f(ty - r * 0.42 + oy)}" r="{f(rr)}"/>')
    add('</g>')
    # warm rim, only on the lamp side, and restrained
    add('<g fill="#4e6b2c" opacity="0.42">')
    for _ in range(9):
        ox = rng.gauss(0, r * 0.40)
        oy = rng.gauss(0, r * 0.26)
        rr = r * rng.uniform(0.16, 0.30)
        add(f'<circle cx="{f(tx + ox + r * 0.20)}" cy="{f(ty - r * 0.34 + oy)}" r="{f(rr)}"/>')
    add('</g>')
    # a few leaves catching the lamp directly
    add('<g fill="#8fae4a" opacity="0.30">')
    for _ in range(5):
        add(f'<circle cx="{f(tx + rng.gauss(0, r * 0.34) + r * 0.24)}" '
            f'cy="{f(ty - r * 0.30 + rng.gauss(0, r * 0.20))}" r="{f(r * rng.uniform(0.07, 0.13))}"/>')
    add('</g>')
add('</g>')

# ── planters and hedges along the plaza edge ────────────────────────────────
for px, pw in [(40, 300), (392, 250), (700, 240), (1000, 250), (1310, 250)]:
    add(f'<rect x="{px}" y="{HORIZON - 6}" width="{pw}" height="46" fill="#1c2148"/>')
    add(f'<g fill="#1b3a2e">')
    for _ in range(10):
        add(f'<circle cx="{f(px + rng.uniform(8, pw - 8))}" cy="{f(HORIZON + rng.uniform(-2, 16))}" '
            f'r="{f(rng.uniform(9, 17))}"/>')
    add('</g>')
    add(f'<g fill="#8cc247" opacity="0.45">')
    for _ in range(7):
        add(f'<circle cx="{f(px + rng.uniform(8, pw - 8))}" cy="{f(HORIZON + rng.uniform(-4, 10))}" '
            f'r="{f(rng.uniform(4, 8))}"/>')
    add('</g>')

# ── wet paving ──────────────────────────────────────────────────────────────
add(f'<rect x="0" y="{HORIZON + 42}" width="{W}" height="{H - HORIZON - 42}" fill="url(#paving)"/>')

# paving joints: subtle, and they fade out toward the horizon so the ground
# does not read as stacked stripes
y = HORIZON + 52
step = 9
while y < H:
    depth = (y - HORIZON) / (H - HORIZON)
    add(f'<line x1="0" y1="{f(y)}" x2="{W}" y2="{f(y)}" stroke="#0d1030" '
        f'stroke-width="1" opacity="{f(0.10 + depth * 0.30)}"/>')
    y += step
    step *= 1.16

# the wet ground catches the bright horizon: a hot strip just below it
add(f'<g filter="url(#blur9)">'
    f'<rect x="0" y="{HORIZON + 44}" width="{W}" height="26" fill="#b9b6ff" opacity="0.22"/></g>')

# reflections: every light source throws a streak toward the viewer
LIGHTS = [(246, 618), (539, 644), (855, 604), (1177, 630), (1464, 650)]
for lx, ly in LIGHTS:
    add(f'<g filter="url(#blur9)">'
        f'<ellipse cx="{f(lx)}" cy="{f(ly)}" rx="70" ry="80" fill="#ffce8f" opacity="0.42"/></g>')
    # reflection: a narrow core with a wider, fainter skirt
    add(f'<g filter="url(#blur9)">'
        f'<rect x="{f(lx - 5)}" y="{f(HORIZON + 40)}" width="10" '
        f'height="{f((H - HORIZON) * 0.86)}" fill="url(#refl)" opacity="0.75"/></g>')
    add(f'<g filter="url(#blur18)">'
        f'<rect x="{f(lx - 20)}" y="{f(HORIZON + 40)}" width="40" '
        f'height="{f((H - HORIZON) * 0.6)}" fill="url(#refl)" opacity="0.22"/></g>')

# reflections of the warm windows and the entrance
for rx, rw, op in [(508, 22, 0.5), (556, 30, 0.6), (622, 18, 0.4), (760, 16, 0.28),
                   (812, 22, 0.45), (1108, 26, 0.4), (1340, 22, 0.36), (1420, 18, 0.3),
                   (1466, 14, 0.26)]:
    add(f'<g filter="url(#blur9)">'
        f'<rect x="{rx}" y="{HORIZON + 40}" width="{rw}" height="{f((H - HORIZON) * rng.uniform(0.55, 0.9))}" '
        f'fill="#ffc078" opacity="{op}" style="filter:blur(9px)"/></g>')

# vertical falloff on the near ground, plus a sheen, so it is not one flat slab
add(f'<rect x="0" y="{HORIZON + 42}" width="{W}" height="{H - HORIZON - 42}" '
    f'fill="{hsl(248, 62, 6, 0.0)}"/>')
add(f'<rect x="0" y="{HORIZON + 42}" width="{W}" height="{H - HORIZON - 42}" '
    f'fill="url(#groundfall)"/>')
add(f'<rect x="0" y="{H - 150}" width="{W}" height="150" '
    f'fill="{hsl(230, 70, 72, 0.10)}"/>')

# ── lamp posts ──────────────────────────────────────────────────────────────
for lx, ly in LIGHTS:
    add(f'<rect x="{f(lx - 3)}" y="{f(ly)}" width="6" height="{f(HORIZON - ly + 46)}" fill="#0d1231"/>')
    add(f'<rect x="{f(lx - 9)}" y="{f(ly - 12)}" width="18" height="14" rx="3" fill="#ffe0ac"/>')
    add(f'<circle cx="{f(lx)}" cy="{f(ly - 5)}" r="26" fill="#ffd9a0" opacity="0.30" filter="url(#blur9)"/>')

add('</svg>')

out_path = Path(__file__).resolve().parent.parent / "public" / "avatars" / "campus-night.svg"
out_path.write_text("\n".join(out), encoding="utf-8")
print(f"wrote {out_path} ({out_path.stat().st_size} bytes, {len(out)} elements)")
