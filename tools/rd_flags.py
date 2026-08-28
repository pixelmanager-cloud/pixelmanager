#!/usr/bin/env python3
"""Generate original national flags for the game's fictional nations via the Retro Diffusion API.

One flag per nation in shared/src/intl.ts NATIONS. Original AI art -> zero licensing risk. Reads the API
key from $RD_API_KEY or a gitignored key file (tools/.rd_key), never from chat/repo. Deterministic varied
flag layouts (tricolors, crosses, cantons, emblems) in muted heraldic palettes (no fluorescent colours),
downscaled to 32x32 pixel tiles saved as flag-<slug>.png, plus a labelled contact sheet for review.

Run:  RD_API_KEY=rdpk-... python3 tools/rd_flags.py    (or put the key in tools/.rd_key)
"""
import os, sys, json, base64, io, time, re, urllib.request
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "client", "public", "flags")
ENDPOINT = "https://api.retrodiffusion.ai/v1/inferences"
STYLE = os.environ.get("RD_STYLE", "rd_fast__default")
GEN = int(os.environ.get("RD_SIZE", "64"))
FINAL = 32

# fictional nations — keep in sync with shared/src/intl.ts NATIONS
NATIONS = ["Astoria","Calderia","Vinland","Montara","Sorvania","Kesselund","Norhavn","Lechia","Trentino",
    "Valgard","Rhodania","Cascar","Ferralta","Ostmark","Bruneland","Aldoria","Marenne","Duruvia","Halden",
    "Poranto","Zelmark","Ivria","Caldros","Ostrovia","Menteria","Bravanto","Nystrand","Tavora","Groland",
    "Escalona","Volenza","Ardennes"]

LAYOUTS = ["horizontal tricolour of {a}, {b} and {c}",
    "vertical tricolour of {a}, {b} and {c}",
    "horizontal bicolour, {a} over {b}",
    "vertical bicolour of {a} and {b}",
    "off-centre Nordic cross, {b} cross on a {a} field",
    "diagonal bicolour split, {a} and {b}",
    "a {a} field with a {b} canton of small stars",
    "a solid {a} field with a large centred {b} star",
    "a solid {a} field with a centred {b} sunburst",
    "{a} field with a broad central {b} stripe bordered {c}",
    "quartered {a} and {b}",
    "a {a} field with a {b} crescent and star"]
# muted, flag-appropriate palette (no fluorescent tones)
COLS = ["deep crimson","navy blue","forest green","gold","white","black","maroon","royal blue",
    "burgundy","sky blue","cream","charcoal grey","teal","olive green","rust orange","slate blue"]

def slug(n): return re.sub(r"[^a-z0-9]+", "-", n.lower()).strip("-")

def api_key():
    k = os.environ.get("RD_API_KEY")
    if k: return k.strip()
    for p in (os.path.join(ROOT, "tools", ".rd_key"), os.path.expanduser("~/.rd_key")):
        if os.path.exists(p):
            with open(p) as f: return f.read().strip()
    sys.exit("No API key. Set RD_API_KEY or put it in tools/.rd_key")

def prompt_for(i):
    lay = LAYOUTS[i % len(LAYOUTS)]
    a = COLS[(i * 5 + 1) % len(COLS)]; b = COLS[(i * 3 + 7) % len(COLS)]; c = COLS[(i * 7 + 4) % len(COLS)]
    if b == a: b = COLS[(i * 3 + 8) % len(COLS)]
    if c in (a, b): c = COLS[(i * 7 + 5) % len(COLS)]
    design = lay.format(a=a, b=b, c=c)
    return f"a national flag, {design}, flat solid colours, bold clean, symmetrical, no text"

def request(key, prompt, seed, retries=4):
    body = json.dumps({"prompt": prompt, "prompt_style": STYLE, "width": GEN, "height": GEN,
                       "num_images": 1, "seed": seed, "remove_bg": False}).encode()
    last = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(ENDPOINT, data=body, method="POST",
                                         headers={"X-RD-Token": key, "Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=120) as r:
                res = json.loads(r.read())
            if res.get("base64_images"): return res
            last = res.get("error", res)
        except Exception as e:
            last = e
        time.sleep(2 + attempt * 2)
    raise RuntimeError(f"failed after {retries} attempts: {last}")

def pixelate(im):
    im = im.convert("RGB").resize((FINAL, FINAL), Image.LANCZOS)
    return im.quantize(colors=12, method=Image.FASTOCTREE).convert("RGB")

def main():
    key = api_key()
    os.makedirs(OUT, exist_ok=True)
    regen = os.environ.get("RD_REGEN", "").strip()  # comma-list of nation names/slugs to redo
    todo = list(enumerate(NATIONS))
    if regen:
        want = {slug(x) for x in regen.replace(", ", ",").split(",") if x}
        todo = [(i, n) for i, n in enumerate(NATIONS) if slug(n) in want]
    print(f"generating {len(todo)} flag(s)")
    for i, n in todo:
        try:
            res = request(key, prompt_for(i), 4200 + i * 13)
            im = Image.open(io.BytesIO(base64.b64decode(res["base64_images"][0])))
            pixelate(im).save(os.path.join(OUT, f"flag-{slug(n)}.png"))
            print(f"  {n:10} -> flag-{slug(n)}.png   (balance {res.get('remaining_balance')})")
        except Exception as e:
            print(f"  {n} error (skipped):", e)
    # labelled contact sheet for review
    cols, cell, pad, lbl = 8, 40, 6, 12
    import glob
    files = [(n, os.path.join(OUT, f"flag-{slug(n)}.png")) for n in NATIONS if os.path.exists(os.path.join(OUT, f"flag-{slug(n)}.png"))]
    rows = (len(files) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * (cell + pad) + pad, rows * (cell + lbl + pad) + pad), (24, 24, 28))
    d = ImageDraw.Draw(sheet)
    try: font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 9)
    except Exception: font = ImageFont.load_default()
    for k, (n, p) in enumerate(files):
        r, cc = divmod(k, cols)
        x = pad + cc * (cell + pad); y = pad + r * (cell + lbl + pad)
        tile = Image.open(p).convert("RGB").resize((cell, cell), Image.NEAREST)
        sheet.paste(tile, (x, y))
        d.text((x, y + cell + 1), n[:9], fill=(210, 210, 215), font=font)
    sheet.save("/tmp/flags_sheet.png")
    print(f"contact sheet -> /tmp/flags_sheet.png ({len(files)} flags)")

if __name__ == "__main__":
    main()
