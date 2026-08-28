#!/usr/bin/env python3
"""Fictional national-flag generator (16x16, framed) for the game's 32 made-up World-Finals nations.

The nations are fictional (Astoria, Calderia, ...), so we GENERATE a distinct flag for each, using the
real-world flag vocabulary as design reference: tribands, bicolours, offset (Nordic) crosses, canton+field,
and centred emblems (disc / star / crescent). Deterministic per nation name. Matches the mikobrzu-style
16x16 framed pixel look so it sits alongside the club badges.

Output: client/public/flags/<slug>.png  (+ a contact sheet /tmp/flag_contact.png)
Run:  python3 tools/gen_flags.py
"""
import os, math
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "client", "public", "flags")
os.makedirs(OUT, exist_ok=True)

# the 32 nations (must match shared/src/intl.ts NATIONS)
NATIONS = ["Astoria","Calderia","Vinland","Montara","Sorvania","Kesselund","Norhavn","Lechia","Trentino",
    "Valgard","Rhodania","Cascar","Ferralta","Ostmark","Bruneland","Aldoria","Marenne","Duruvia","Halden",
    "Poranto","Zelmark","Ivria","Caldros","Ostrovia","Menteria","Bravanto","Nystrand","Tavora","Groland",
    "Escalona","Volenza","Ardennes"]

FRAME = (18, 18, 34)
# a rich flag palette (field colours) + light emblem colours
FIELD = [(196,30,44),(0,60,136),(0,122,61),(255,205,0),(240,240,245),(20,22,34),(0,110,170),
         (140,20,60),(30,90,60),(180,90,20),(90,40,120),(0,140,120),(210,120,30),(60,70,90)]
LIGHT = [(255,255,255),(255,214,90),(245,246,250),(120,200,255)]
def h32(s):
    h = 2166136261
    for c in s: h = ((h ^ ord(c)) * 16777619) & 0xffffffff
    return h or 1

PATTERNS = ["htriband","vtriband","hbicolor","vbicolor","cross","canton","disc","star","diag","triband_disc"]

def star_pts(cx, cy, ro, ri, n=5, rot=-math.pi/2):
    return [(cx + (ro if i%2==0 else ri)*math.cos(rot+i*math.pi/n),
             cy + (ro if i%2==0 else ri)*math.sin(rot+i*math.pi/n)) for i in range(n*2)]

def pick(seed, arr, salt=0):
    return arr[(seed // (salt*7 + 1)) % len(arr)]

def make_flag(name):
    seed = h32(name)
    c1 = FIELD[seed % len(FIELD)]
    c2 = FIELD[(seed >> 4) % len(FIELD)]
    if c2 == c1: c2 = FIELD[(seed >> 4) % len(FIELD) - 1]
    c3 = FIELD[(seed >> 9) % len(FIELD)]
    if c3 in (c1, c2): c3 = LIGHT[0]
    emb = LIGHT[(seed >> 13) % len(LIGHT)]
    pat = PATTERNS[(seed >> 17) % len(PATTERNS)]
    img = Image.new("RGBA", (16, 16), FRAME + (255,))
    d = ImageDraw.Draw(img)
    def fill(x0, y0, x1, y1, c): d.rectangle([x0, y0, x1, y1], fill=c + (255,))
    # interior is 1..14
    fill(1, 1, 14, 14, c1)
    if pat == "htriband":
        fill(1, 1, 14, 5, c1); fill(1, 6, 14, 9, c2); fill(1, 10, 14, 14, c3)
    elif pat == "vtriband":
        fill(1, 1, 5, 14, c1); fill(6, 1, 9, 14, c2); fill(10, 1, 14, 14, c3)
    elif pat == "hbicolor":
        fill(1, 1, 14, 7, c1); fill(1, 8, 14, 14, c2)
    elif pat == "vbicolor":
        fill(1, 1, 7, 14, c1); fill(8, 1, 14, 14, c2)
    elif pat == "cross":
        fill(1, 1, 14, 14, c1); fill(5, 1, 7, 14, c2); fill(1, 6, 14, 8, c2)   # offset Nordic cross
    elif pat == "canton":
        fill(1, 1, 14, 14, c1); fill(1, 1, 7, 7, c2)
        d.polygon(star_pts(4, 4, 3, 1.3), fill=emb + (255,))
    elif pat == "disc":
        fill(1, 1, 14, 14, c1); fill(1, 8, 14, 14, c2) if (seed >> 3) % 2 else None
        d.ellipse([8-4, 8-4, 8+4, 8+4], fill=emb + (255,))
    elif pat == "star":
        fill(1, 1, 14, 7, c1); fill(1, 8, 14, 14, c2)
        d.polygon(star_pts(7.5, 7.5, 5, 2.1), fill=emb + (255,))
    elif pat == "diag":
        for y in range(1, 15):
            for x in range(1, 15):
                d.point((x, y), fill=(c2 if (x + y) < 15 else c1) + (255,))
    elif pat == "triband_disc":
        fill(1, 1, 5, 14, c1); fill(6, 1, 9, 14, LIGHT[0]); fill(10, 1, 14, 14, c1)
        d.ellipse([7.5-3, 7.5-3, 7.5+3, 7.5+3], fill=c2 + (255,))
    return img

def slug(name): return name.lower()

def main():
    for n in NATIONS:
        make_flag(n).save(os.path.join(OUT, f"{slug(n)}.png"))
    # contact sheet
    cols, cell = 8, 18
    rows = (len(NATIONS) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * cell, rows * cell), (28, 28, 46, 255))
    for i, n in enumerate(NATIONS):
        sheet.alpha_composite(Image.open(os.path.join(OUT, f"{slug(n)}.png")).convert("RGBA"),
                              ((i % cols) * cell + 1, (i // cols) * cell + 1))
    sheet.resize((sheet.width * 7, sheet.height * 7), Image.NEAREST).save("/tmp/flag_contact.png")
    print(f"wrote {len(NATIONS)} flags to {OUT}; contact sheet /tmp/flag_contact.png")

if __name__ == "__main__":
    main()
