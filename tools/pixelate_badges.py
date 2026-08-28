#!/usr/bin/env python3
"""Pixelate the "minimal logos" club crests into the game's 32x32 badge set.

Takes every logo in <PACK>/<Country>/normal/*.png (England/Spain/Croatia/Italy), trims empty margins so
the crest fills the badge, downscales to 32x32 with antialiasing, quantizes to a small palette for a crisp
pixel-art look, and (per the brief) stamps a subtle star / ring / stripe into any badge left with a big
blank central area. Output: client/public/badges/badge-1..N.png (+ /tmp/badge_contact.png).

Run:  python3 tools/pixelate_badges.py
"""
import os, glob, math
from collections import Counter
from PIL import Image, ImageDraw

PACK = os.path.expanduser("~/Desktop/PIXELGRAPHICS/minimal logos 2023 v230524")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "client", "public", "badges")
SIZE = 32
COLORS = 14
COUNTRIES = ["England", "Spain", "Croatia", "Italy"]

def h32(s):
    h = 2166136261
    for c in s: h = ((h ^ ord(c)) * 16777619) & 0xffffffff
    return h or 1

def pixelate(im):
    im = im.convert("RGBA")
    bbox = im.getbbox()                       # trim transparent margins → crest fills the tile
    if bbox: im = im.crop(bbox)
    w, h = im.size; s = max(w, h)
    sq = Image.new("RGBA", (s, s), (0, 0, 0, 0)); sq.paste(im, ((s-w)//2, (s-h)//2)); im = sq
    pad = int(s * 0.06)                        # a hair of breathing room
    im = im.crop((-pad, -pad, s+pad, s+pad)) if pad else im
    small = im.resize((SIZE, SIZE), Image.LANCZOS)
    rgb = small.convert("RGB").quantize(colors=COLORS, method=Image.FASTOCTREE).convert("RGB")
    a = small.getchannel("A").point(lambda v: 255 if v > 110 else 0)
    return Image.merge("RGBA", (*rgb.split(), a))

def center_flat(im):
    """Dominant colour of the central 10x10 if it's a large uniform (fillable) area, else None."""
    px = im.load(); c = Counter()
    for y in range(11, 21):
        for x in range(11, 21):
            p = px[x, y]
            if p[3] > 128: c[p[:3]] += 1
    tot = sum(c.values())
    if tot < 64: return None                   # mostly transparent centre → nothing to fill
    col, n = c.most_common(1)[0]
    return col if n / tot > 0.72 else None

def lum(c): return 0.299*c[0] + 0.587*c[1] + 0.114*c[2]

def stamp(im, seed, base):
    """Add a small deterministic star / ring / stripes in a blank centre, contrasting the base colour."""
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
    else:  # stripes
        for yy in (cy-3, cy, cy+3):
            outlined(lambda dx,dy,c,yy=yy: d.rectangle([cx-6+dx, yy+dy, cx+6+dx, yy+1+dy], fill=c+(255,)))

def main():
    os.makedirs(OUT, exist_ok=True)
    for f in glob.glob(os.path.join(OUT, "*.png")): os.remove(f)
    files = []
    for c in COUNTRIES:
        files += sorted(glob.glob(os.path.join(PACK, c, "normal", "*.png")))
    n = 0; stamped = 0
    for f in files:
        try:
            b = pixelate(Image.open(f))
        except Exception as e:
            print("skip", f, e); continue
        flat = center_flat(b)
        if flat is not None and (h32(f) % 5 < 3):   # ~60% of the blank-centred ones get a motif
            stamp(b, h32(f), flat); stamped += 1
        n += 1
        b.save(os.path.join(OUT, f"badge-{n}.png"))
    # contact sheet
    cols, cell = 12, 36
    rows = (n + cols - 1) // cols
    sheet = Image.new("RGBA", (cols*cell, rows*cell), (232, 232, 238, 255))
    for i in range(n):
        sheet.alpha_composite(Image.open(os.path.join(OUT, f"badge-{i+1}.png")).convert("RGBA"),
                              ((i % cols)*cell+2, (i // cols)*cell+2))
    sheet.resize((sheet.width*3, sheet.height*3), Image.NEAREST).save("/tmp/badge_contact.png")
    print(f"pixelated {n} badges ({stamped} got an added motif) → {OUT}; contact sheet /tmp/badge_contact.png; set BADGE_COUNT={n}")

if __name__ == "__main__":
    main()
