#!/usr/bin/env python3
"""Generate pixel-art UI icons via the Retro Diffusion API to replace the hand-pixeled set in sprites.ts.

One transparent 32x32 icon per functional key. Original AI art -> zero licensing risk. Key from
$RD_API_KEY or gitignored tools/.rd_key, never chat/repo. We keep whichever reads better (RD vs the
existing grid) per icon when wiring. Writes icon-<key>.png + a labelled contact sheet.

Run:  RD_API_KEY=rdpk-... python3 tools/rd_icons.py
      RD_REGEN="trophy,coin" python3 tools/rd_icons.py   (specific icons)
"""
import os, sys, json, base64, io, time, urllib.request
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "client", "public", "icons")
ENDPOINT = "https://api.retrodiffusion.ai/v1/inferences"
STYLE = os.environ.get("RD_STYLE", "rd_fast__default")
GEN = int(os.environ.get("RD_SIZE", "64"))
FINAL = 32

# functional icon key -> subject description (flag/badge excluded: dedicated assets already exist)
ICONS = {
    "stadium": "a football stadium with floodlights",
    "training": "a football training cone",
    "youth": "a small green sprouting seedling",
    "scouting": "a magnifying glass",
    "medical": "a red medical first-aid cross",
    "sponsor": "a handshake",
    "fanzone": "a megaphone",
    "ball": "a black and white soccer ball",
    "trophy": "a golden trophy cup",
    "medal": "a gold medal on a ribbon",
    "card": "a referee yellow card",
    "kit": "a football jersey shirt",
    "laurel": "a golden laurel wreath",
    "banner": "a hanging triangular pennant banner",
    "seal": "a red wax seal stamp",
    "armband": "a captain armband",
    "contract": "a signed paper contract document",
    "briefcase": "a brown leather briefcase",
    "star": "a gold five-point star",
    "calendar": "a calendar page",
    "crown": "a golden royal crown",
    "coin": "a shiny gold coin",
    "whistle": "a referee whistle",
    "boot": "a football boot with studs",
}

def prompt_for(desc):
    return f"a simple pixel art icon of {desc}, single centered object, flat solid colors, bold dark outline, transparent background, no text"

def api_key():
    k = os.environ.get("RD_API_KEY")
    if k: return k.strip()
    for p in (os.path.join(ROOT, "tools", ".rd_key"), os.path.expanduser("~/.rd_key")):
        if os.path.exists(p):
            with open(p) as f: return f.read().strip()
    sys.exit("No API key. Set RD_API_KEY or put it in tools/.rd_key")

def request(key, prompt, seed, retries=4):
    body = json.dumps({"prompt": prompt, "prompt_style": STYLE, "width": GEN, "height": GEN,
                       "num_images": 1, "seed": seed, "remove_bg": True}).encode()
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
    im = im.convert("RGBA")
    bbox = im.getbbox()
    if bbox: im = im.crop(bbox)
    w, h = im.size; s = max(w, h)
    sq = Image.new("RGBA", (s, s), (0, 0, 0, 0)); sq.paste(im, ((s - w) // 2, (s - h) // 2))
    small = sq.resize((FINAL, FINAL), Image.LANCZOS)
    rgb = small.convert("RGB").quantize(colors=16, method=Image.FASTOCTREE).convert("RGB")
    a = small.getchannel("A").point(lambda v: 255 if v > 110 else 0)
    return Image.merge("RGBA", (*rgb.split(), a))

def contact_sheet():
    import glob
    keys = [k for k in ICONS if os.path.exists(os.path.join(OUT, f"icon-{k}.png"))]
    cols, cell, pad, lbl = 8, 44, 8, 12
    rows = (len(keys) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * (cell + pad) + pad, rows * (cell + lbl + pad) + pad), (24, 24, 28))
    d = ImageDraw.Draw(sheet)
    try: font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 9)
    except Exception: font = ImageFont.load_default()
    for k, key in enumerate(keys):
        r, cc = divmod(k, cols); x = pad + cc * (cell + pad); y = pad + r * (cell + lbl + pad)
        t = Image.open(os.path.join(OUT, f"icon-{key}.png")).convert("RGBA").resize((cell, cell), Image.NEAREST)
        sheet.paste(t, (x, y), t)
        d.text((x, y + cell + 1), key[:8], fill=(210, 210, 215), font=font)
    sheet.save("/tmp/icons_sheet.png")
    print(f"contact sheet -> /tmp/icons_sheet.png ({len(keys)})")

def main():
    key = api_key()
    os.makedirs(OUT, exist_ok=True)
    regen = os.environ.get("RD_REGEN", "").strip()
    todo = [k for k in regen.replace(" ", "").split(",") if k] if regen else list(ICONS.keys())
    print(f"generating {len(todo)} icon(s)")
    for i, k in enumerate(todo):
        if k not in ICONS: print(f"  ?? unknown icon '{k}'"); continue
        try:
            res = request(key, prompt_for(ICONS[k]), 8100 + list(ICONS).index(k) * 11)
            im = Image.open(io.BytesIO(base64.b64decode(res["base64_images"][0])))
            pixelate(im).save(os.path.join(OUT, f"icon-{k}.png"))
            print(f"  {k:10} (balance {res.get('remaining_balance')})")
        except Exception as e:
            print(f"  {k} error (skipped):", e)
    contact_sheet()

if __name__ == "__main__":
    main()
