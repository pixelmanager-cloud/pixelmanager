#!/usr/bin/env python3
"""Football-club badge generator — extends the mikobrzu "18 badges + 7 templates" pack (32x32).

Uses the pack's 7 blank template SHAPES (black outline + cream interior) as bases and fills them with
deterministic team colour-schemes + patterns + a clean geometric emblem, in the pack's pixel-art style.
Copies the 18 hand-drawn originals through unchanged, then generates enough extra to reach TARGET total.
Output: client/public/badges/badge-1.png .. badge-N.png (+ a contact sheet for review).

Emblems are geometric (star/ring/disc/cross/saltire/chevron/diamond/crown/bars/ball) NOT letters, because
crest.ts assigns badges to clubs by name-hash — a letter emblem would mismatch the club name.

Run:  python3 tools/gen_badges.py [PACK_DIR]
"""
import os, sys, math
from PIL import Image, ImageDraw

PACK = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser(
    "~/Desktop/PIXELGRAPHICS/football_badges_32x32")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "client", "public", "badges")
TARGET = 64
os.makedirs(OUT, exist_ok=True)

CREAM = (255, 241, 232)          # the template interior fill we recolour
def is_interior(px):             # treat any near-cream opaque pixel as fillable interior
    r, g, b, a = px
    return a > 0 and r > 228 and g > 222 and b > 210

# deep, saturated club colours + light accents (matched to the sample palette)
PRIMARY = [(179,18,43),(14,42,94),(31,111,67),(20,20,31),(90,16,48),(184,134,11),
           (19,78,111),(122,31,143),(11,107,107),(20,75,138),(138,28,28),(46,90,31),
           (191,87,0),(60,60,68),(120,20,60),(23,58,45)]
ACCENT  = [(240,230,200),(255,210,74),(238,242,255),(127,199,255),(255,255,255),(226,178,54)]
EMBLEM_LIGHT = [(255,255,255),(255,214,90),(240,230,200),(190,232,255)]
OUTLINE = (11,11,24)

PATTERNS = ["solid","vhalf","vstripe","hband","sash","quarters","cross_field","hoop"]
EMBLEMS  = ["star","ring","disc","plus","saltire","chevron","diamond","crown","bars","ball"]

def pattern_color(pat, x, y, prim, acc):
    if pat == "solid":       return prim
    if pat == "vhalf":       return acc if x >= 16 else prim
    if pat == "vstripe":     return acc if (x // 4) % 2 else prim
    if pat == "hband":       return acc if 12 <= y <= 19 else prim
    if pat == "sash":        return acc if 0 <= (x + y - 16) < 7 else prim
    if pat == "quarters":    return acc if ((x < 16) ^ (y < 16)) else prim
    if pat == "cross_field": return acc if (13 <= x <= 18 or 13 <= y <= 18) else prim
    if pat == "hoop":        return acc if 10 <= y <= 15 else prim
    return prim

def star_points(cx, cy, r_out, r_in, n=5, rot=-math.pi/2):
    pts = []
    for i in range(n * 2):
        r = r_out if i % 2 == 0 else r_in
        a = rot + i * math.pi / n
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts

def lighten(c, f=1.32): return tuple(min(255, int(v * f)) for v in c[:3])
def darken(c, f=0.62):  return tuple(max(0, int(v * f)) for v in c[:3])

def is_outline(px): return px[3] > 0 and px[0] < 60 and px[1] < 60 and px[2] < 70
def is_empty(px):   return px[3] == 0

def bevel_and_rim(img, rim):
    """Give the filled interior depth: a top highlight, bottom shadow, and a coloured side rim — reads as
    a raised, framed badge instead of a flat fill."""
    px = img.load()
    src = img.copy().load()
    for y in range(32):
        for x in range(32):
            p = src[x, y]
            if is_outline(p) or is_empty(p):
                continue  # only touch the painted interior
            up = src[x, y-1] if y > 0 else (0,0,0,0)
            dn = src[x, y+1] if y < 31 else (0,0,0,0)
            lf = src[x-1, y] if x > 0 else (0,0,0,0)
            rt = src[x+1, y] if x < 31 else (0,0,0,0)
            edge_up = is_outline(up) or is_empty(up)
            edge_dn = is_outline(dn) or is_empty(dn)
            edge_side = is_outline(lf) or is_empty(lf) or is_outline(rt) or is_empty(rt)
            if edge_up:      px[x, y] = lighten(p) + (255,)      # top rim catches light
            elif edge_dn:    px[x, y] = darken(p) + (255,)       # bottom rim in shadow
            elif edge_side:  px[x, y] = rim + (255,)             # coloured side frame

def draw_emblem(base, kind, col):
    """Draw a geometric emblem centred, with a 1px dark outline + a soft top highlight (2-tone)."""
    lay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    cx, cy = 16, 16
    def outlined(fn):
        # fat dark outline (8-neighbour), then the fill on top
        for dx, dy in ((-1,0),(1,0),(0,-1),(0,1),(-1,-1),(1,1),(-1,1),(1,-1)):
            fn(d, dx, dy, OUTLINE)
        fn(d, 0, 0, col)
    if kind == "star":
        outlined(lambda d,dx,dy,c: d.polygon(star_points(cx+dx, cy+dy, 8, 3.4), fill=c))
    elif kind == "ring":
        outlined(lambda d,dx,dy,c: d.ellipse([cx-7+dx, cy-7+dy, cx+7+dx, cy+7+dy], outline=c, width=3))
    elif kind == "disc":
        outlined(lambda d,dx,dy,c: d.ellipse([cx-6+dx, cy-6+dy, cx+6+dx, cy+6+dy], fill=c))
    elif kind == "plus":
        outlined(lambda d,dx,dy,c: (d.rectangle([cx-2+dx, cy-8+dy, cx+2+dx, cy+8+dy], fill=c),
                                    d.rectangle([cx-8+dx, cy-2+dy, cx+8+dx, cy+2+dy], fill=c)))
    elif kind == "saltire":
        outlined(lambda d,dx,dy,c: (d.line([cx-8+dx, cy-8+dy, cx+8+dx, cy+8+dy], fill=c, width=3),
                                    d.line([cx-8+dx, cy+8+dy, cx+8+dx, cy-8+dy], fill=c, width=3)))
    elif kind == "chevron":
        outlined(lambda d,dx,dy,c: (d.line([cx-8+dx, cy+2+dy, cx+dx, cy-6+dy], fill=c, width=3),
                                    d.line([cx+dx, cy-6+dy, cx+8+dx, cy+2+dy], fill=c, width=3),
                                    d.line([cx-8+dx, cy+8+dy, cx+dx, cy+dy], fill=c, width=3),
                                    d.line([cx+dx, cy+dy, cx+8+dx, cy+8+dy], fill=c, width=3)))
    elif kind == "diamond":
        outlined(lambda d,dx,dy,c: d.polygon([(cx+dx,cy-8+dy),(cx+8+dx,cy+dy),(cx+dx,cy+8+dy),(cx-8+dx,cy+dy)], fill=c))
    elif kind == "crown":
        outlined(lambda d,dx,dy,c: (d.polygon([(cx-8+dx,cy+6+dy),(cx-8+dx,cy-4+dy),(cx-4+dx,cy+dy),(cx+dx,cy-6+dy),
                                               (cx+4+dx,cy+dy),(cx+8+dx,cy-4+dy),(cx+8+dx,cy+6+dy)], fill=c),
                                    d.rectangle([cx-8+dx, cy+5+dy, cx+8+dx, cy+8+dy], fill=c)))
    elif kind == "bars":
        outlined(lambda d,dx,dy,c: [d.rectangle([cx-8+dx, cy-7+2+i*5+dy, cx+8+dx, cy-4+2+i*5+dy], fill=c) for i in range(3)])
    elif kind == "ball":
        outlined(lambda d,dx,dy,c: d.ellipse([cx-7+dx, cy-7+dy, cx+7+dx, cy+7+dy], outline=c, width=2))
        d.polygon(star_points(cx, cy, 4.2, 2.1, n=5), fill=OUTLINE)  # a pentagon-ish centre spot
    return lay

def draw_roundel(img, seed, prim):
    """A contrasting disc behind the emblem — focuses it and adds depth (like many pack samples). Returns
    True if drawn. Only drawn where the badge centre is solid interior (skip banners/thin shapes)."""
    px = img.load()
    if not is_interior_now(px[16, 16]) and not (px[16,16][3] > 0 and not is_outline(px[16,16])):
        return False
    dark = (seed % 2 == 0)
    disc = darken(prim, 0.45) if dark else (238, 234, 222)
    ring = (238, 234, 222) if dark else darken(prim, 0.5)
    d = ImageDraw.Draw(img)
    d.ellipse([16-9, 16-9, 16+9, 16+9], fill=ring + (255,))
    d.ellipse([16-8, 16-8, 16+8, 16+8], fill=OUTLINE + (255,))
    d.ellipse([16-7, 16-7, 16+7, 16+7], fill=disc + (255,))
    d.arc([16-7, 16-7, 16+7, 16+7], 200, 320, fill=lighten(disc, 1.4) + (255,))  # top sheen
    return True

def is_interior_now(p):  # a painted (opaque, non-outline) interior pixel
    return p[3] > 0 and not is_outline(p)

def add_pips(img, seed, acc):
    """A few small decorative studs, for texture on plainer badges."""
    d = ImageDraw.Draw(img)
    layout = seed % 3
    pts = []
    if layout == 0: pts = [(16, 5), (16, 27)]        # top & bottom
    elif layout == 1: pts = [(6, 10), (26, 10)]      # upper flanks
    for (x, y) in pts:
        if is_interior_now(img.load()[x, y]):
            d.rectangle([x-1, y-1, x+1, y+1], fill=OUTLINE + (255,))
            d.point((x, y), fill=acc + (255,))

def make_badge(template, seed):
    prim = PRIMARY[seed % len(PRIMARY)]
    acc  = ACCENT[(seed // 3) % len(ACCENT)]
    pat  = PATTERNS[(seed // 5) % len(PATTERNS)]
    emb  = EMBLEMS[(seed // 7) % len(EMBLEMS)]
    ecol = EMBLEM_LIGHT[(seed // 11) % len(EMBLEM_LIGHT)]
    if ecol == acc: ecol = EMBLEM_LIGHT[(seed // 11 + 1) % len(EMBLEM_LIGHT)]
    img = template.copy()
    px = img.load()
    # 1) fill the interior with the colour scheme + pattern
    for y in range(32):
        for x in range(32):
            if is_interior(px[x, y]):
                px[x, y] = pattern_color(pat, x, y, prim, acc) + (255,)
    # 2) bevel: top highlight / bottom shadow / coloured side rim → a raised, framed badge
    bevel_and_rim(img, rim=acc)
    # 3) a roundel behind the emblem (most badges) + optional pips (plainer ones)
    roundel = draw_roundel(img, seed, prim) if seed % 3 != 0 else False
    if not roundel and seed % 2 == 0:
        add_pips(img, seed, acc)
    # 4) the emblem on top
    img.alpha_composite(draw_emblem(img, emb, ecol))
    return img

def main():
    tdir = os.path.join(PACK, "Templates")
    bdir = os.path.join(PACK, "Badges")
    templates = [Image.open(os.path.join(tdir, f"t{i}.png")).convert("RGBA") for i in range(1, 8)]
    # 1) copy the 18 hand-drawn originals through as badge-1..18
    n = 0
    for i in range(1, 19):
        src = os.path.join(bdir, f"b{i}.png")
        if os.path.exists(src):
            n += 1
            Image.open(src).convert("RGBA").save(os.path.join(OUT, f"badge-{n}.png"))
    originals = n
    # 2) generate the rest, spreading template/scheme/emblem for variety
    seed = 0
    while n < TARGET:
        t = templates[seed % len(templates)]
        make_badge(t, seed * 3 + 1).save(os.path.join(OUT, f"badge-{n+1}.png"))
        n += 1
        seed += 1
    # 3) a contact sheet (10 cols) for a quick eyeball
    cols, cell = 10, 36
    rows = (n + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * cell, rows * cell), (24, 24, 40, 255))
    for i in range(n):
        b = Image.open(os.path.join(OUT, f"badge-{i+1}.png")).convert("RGBA")
        sheet.alpha_composite(b, ((i % cols) * cell + 2, (i // cols) * cell + 2))
    sheet.resize((sheet.width * 3, sheet.height * 3), Image.NEAREST).save("/tmp/badge_contact.png")
    print(f"wrote {n} badges to {OUT} ({originals} originals + {n-originals} generated); contact sheet /tmp/badge_contact.png")

if __name__ == "__main__":
    main()
