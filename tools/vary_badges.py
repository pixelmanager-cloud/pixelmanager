#!/usr/bin/env python3
"""Remove the too-real-club badges, then multiply the survivors into a big, varied set.

Step 1: drop the flagged badge-N.png (resemble real clubs / national symbols too closely).
Step 2: recolour the survivors (hue-rotate → fresh palettes that read as generic) and stamp a star / ring /
        stripe into blank centres, generating enough badges for a 10-tier league + continental cups.
Renumbers to badge-1..N and prints the count to set BADGE_COUNT in crest.ts. Run: python3 tools/vary_badges.py
"""
import os, glob, math
from collections import Counter
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "client", "public", "badges")
TARGET = 150
# high-confidence real-club / national-symbol resemblances to remove (badge numbers from the numbered sheet)
REMOVE = {52,55,65,64,49, 78,80,83,93,79,99,103,104,113,109,94, 68,71,72,117, 19,50,85,86}

def hue_rotate(im, deg):
    """Shift hue by deg (0..255) — recolours flat regions uniformly, keeping outlines (low-sat) intact."""
    r, g, b, a = im.split()
    H, S, V = Image.merge("RGB", (r, g, b)).convert("HSV").split()
    H = H.point(lambda h: (h + deg) % 256)
    rgb = Image.merge("HSV", (H, S, V)).convert("RGB")
    return Image.merge("RGBA", (*rgb.split(), a))

# a fresh football palette the colour-MIX variant remaps each saturated region onto (a genuine new scheme,
# not just a hue shift — so a blue/red badge can become e.g. green/gold)
MIXPAL = [(179,18,43),(14,42,94),(31,111,67),(240,196,70),(90,16,48),(184,134,11),(19,78,111),
          (122,31,143),(11,107,107),(20,75,138),(46,90,31),(210,120,30),(0,110,170),(140,20,60)]

def color_mix(im, seed):
    """Remap each saturated colour region to a NEW palette colour (keeps dark outlines + whites)."""
    px = im.load()
    freq = Counter()
    for y in range(32):
        for x in range(32):
            p = px[x, y]
            if p[3] > 128: freq[p[:3]] += 1
    mapping = {}; idx = seed
    for c, _ in sorted(freq.items(), key=lambda kv: -kv[1]):
        mx, mn = max(c), min(c)
        if mx < 70 or (mx > 205 and mx - mn < 32):   # dark outline or near-white → keep as-is
            continue
        mapping[c] = MIXPAL[idx % len(MIXPAL)]; idx += 5
    out = im.copy(); o = out.load()
    for y in range(32):
        for x in range(32):
            p = px[x, y]
            if p[:3] in mapping:
                o[x, y] = mapping[p[:3]] + (p[3],)
    return out

def center_flat(im):
    px = im.load(); c = Counter()
    for y in range(11, 21):
        for x in range(11, 21):
            p = px[x, y]
            if p[3] > 128: c[p[:3]] += 1
    tot = sum(c.values())
    if tot < 60: return None
    col, n = c.most_common(1)[0]
    return col if n / tot > 0.7 else None

def lum(c): return 0.299*c[0] + 0.587*c[1] + 0.114*c[2]

def stamp(im, seed, base):
    d = ImageDraw.Draw(im)
    fg = (28, 30, 44) if lum(base) > 140 else (245, 246, 250)
    ol = (245, 246, 250) if lum(base) > 140 else (16, 16, 28)
    kind = ["star", "ring", "stripes", "disc"][seed % 4]
    cx = cy = 16
    def outlined(fn):
        for dx, dy in ((-1,0),(1,0),(0,-1),(0,1)): fn(dx, dy, ol)
        fn(0, 0, fg)
    if kind == "star":
        pts = lambda dx,dy: [(cx+dx + (5 if i%2==0 else 2.1)*math.cos(-math.pi/2+i*math.pi/5),
                              cy+dy + (5 if i%2==0 else 2.1)*math.sin(-math.pi/2+i*math.pi/5)) for i in range(10)]
        outlined(lambda dx,dy,c: d.polygon(pts(dx,dy), fill=c+(255,)))
    elif kind == "ring":
        outlined(lambda dx,dy,c: d.ellipse([cx-5+dx,cy-5+dy,cx+5+dx,cy+5+dy], outline=c+(255,), width=2))
    elif kind == "disc":
        outlined(lambda dx,dy,c: d.ellipse([cx-4+dx,cy-4+dy,cx+4+dx,cy+4+dy], fill=c+(255,)))
    else:
        for yy in (cy-3, cy, cy+3):
            outlined(lambda dx,dy,c,yy=yy: d.rectangle([cx-6+dx, yy+dy, cx+6+dx, yy+1+dy], fill=c+(255,)))

def main():
    files = sorted(glob.glob(os.path.join(OUT, "badge-*.png")), key=lambda p: int(p.split("-")[-1].split(".")[0]))
    survivors = [Image.open(f).convert("RGBA") for f in files if int(f.split("-")[-1].split(".")[0]) not in REMOVE]
    print(f"{len(files)} badges − {len(REMOVE)} removed = {len(survivors)} survivors")
    final = list(survivors)
    hues = [64, 128, 176, 96, 150, 40, 208, 112]
    i = 0
    while len(final) < TARGET:
        src = survivors[i % len(survivors)]
        # alternate: colour-MIX (new palette) and hue-rotate, for two flavours of recolour variety
        if i % 2 == 0:
            v = color_mix(src, i)
        else:
            deg = (hues[(i // len(survivors)) % len(hues)] + (i * 11) % 24) % 256
            v = hue_rotate(src, deg)
        flat = center_flat(v)
        if flat is not None:                 # stars/stripes into the blank ones for extra distinction
            stamp(v, i, flat)
        final.append(v)
        i += 1
    for f in glob.glob(os.path.join(OUT, "*.png")): os.remove(f)
    for n, im in enumerate(final, 1):
        im.save(os.path.join(OUT, f"badge-{n}.png"))
    # contact sheet
    cols, cell = 15, 34
    rows = (len(final) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols*cell, rows*cell), (232, 232, 238, 255))
    for k, im in enumerate(final):
        sheet.alpha_composite(im, ((k % cols)*cell+1, (k // cols)*cell+1))
    sheet.resize((sheet.width*3, sheet.height*3), Image.NEAREST).save("/tmp/badge_contact.png")
    print(f"wrote {len(final)} badges ({len(final)-len(survivors)} recoloured variants) → set BADGE_COUNT={len(final)}; sheet /tmp/badge_contact.png")

if __name__ == "__main__":
    main()
