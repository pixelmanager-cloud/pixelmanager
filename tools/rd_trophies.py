#!/usr/bin/env python3
"""Generate pixel-art trophies / silverware via the Retro Diffusion API (RD Plus — shown large, detail
survives). One transparent 48px piece per award the game grants. Original AI art -> zero licensing risk.
Key from $RD_API_KEY or gitignored tools/.rd_key. Writes trophy-<key>.png + a labelled contact sheet.

Run:  RD_API_KEY=rdpk-... python3 tools/rd_trophies.py     (or RD_REGEN="continental,worldfinals")
"""
import os, sys, json, base64, io, time, urllib.request
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "client", "public", "trophies")
ENDPOINT = "https://api.retrodiffusion.ai/v1/inferences"
STYLE = os.environ.get("RD_STYLE", "rd_plus__default")   # trophies are shown larger -> RD Plus
GEN = int(os.environ.get("RD_SIZE", "64"))
FINAL = 48

TROPHIES = {
    "league": "an ornate golden league champions trophy cup with two handles",
    "cup": "a tall silver domestic knockout cup trophy",
    "continental": "a large silver continental champions cup with big curved handles",
    "worldfinals": "a golden world championship trophy shaped like a globe held up",
    "promotion": "a bronze promotion trophy shield with a laurel",
    "goldenboot": "a golden football boot award on a small plinth",
    "goldenglove": "a golden goalkeeper glove award on a stand",
    "playeroftheseason": "a gold star player-of-the-season statuette award",
    "youngplayer": "a silver star young-player award statuette",
    "topscorer": "a gold medal with a football, top scorer award",
    "dynasty": "an ornate golden heirloom trophy with a family crest, regal",
    "runnerup": "a silver runner-up salver plate award",
}

def prompt_for(desc):
    return f"a pixel art {desc}, single centered object, gleaming metallic, flat bold colors, dark outline, plain background, no text"

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
    for a in range(retries):
        try:
            req = urllib.request.Request(ENDPOINT, data=body, method="POST",
                                         headers={"X-RD-Token": key, "Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=120) as r:
                res = json.loads(r.read())
            if res.get("base64_images"): return res
            last = res.get("error", res)
        except Exception as e:
            last = e
        time.sleep(2 + a * 2)
    raise RuntimeError(f"failed: {last}")

def pixelate(im):
    im = im.convert("RGBA")
    bbox = im.getbbox()
    if bbox: im = im.crop(bbox)
    w, h = im.size; s = max(w, h)
    sq = Image.new("RGBA", (s, s), (0, 0, 0, 0)); sq.paste(im, ((s - w) // 2, (s - h) // 2))
    small = sq.resize((FINAL, FINAL), Image.LANCZOS)
    rgb = small.convert("RGB").quantize(colors=24, method=Image.FASTOCTREE).convert("RGB")
    a = small.getchannel("A").point(lambda v: 255 if v > 110 else 0)
    return Image.merge("RGBA", (*rgb.split(), a))

def contact_sheet():
    keys = [k for k in TROPHIES if os.path.exists(os.path.join(OUT, f"trophy-{k}.png"))]
    cols, cell, pad, lbl = 6, 60, 8, 12
    rows = (len(keys) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * (cell + pad) + pad, rows * (cell + lbl + pad) + pad), (24, 24, 28))
    d = ImageDraw.Draw(sheet)
    try: font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 8)
    except Exception: font = ImageFont.load_default()
    for k, key in enumerate(keys):
        r, cc = divmod(k, cols); x = pad + cc * (cell + pad); y = pad + r * (cell + lbl + pad)
        t = Image.open(os.path.join(OUT, f"trophy-{key}.png")).convert("RGBA").resize((cell, cell), Image.NEAREST)
        sheet.paste(t, (x, y), t)
        d.text((x, y + cell + 1), key[:11], fill=(210, 210, 215), font=font)
    sheet.save("/tmp/trophies_sheet.png")
    print(f"contact sheet -> /tmp/trophies_sheet.png ({len(keys)})")

def main():
    key = api_key()
    os.makedirs(OUT, exist_ok=True)
    regen = os.environ.get("RD_REGEN", "").strip()
    todo = [k for k in regen.replace(" ", "").split(",") if k] if regen else list(TROPHIES.keys())
    print(f"generating {len(todo)} trophy/ies via {STYLE}")
    for k in todo:
        if k not in TROPHIES: print(f"  ?? unknown '{k}'"); continue
        try:
            res = request(key, prompt_for(TROPHIES[k]), 9500 + list(TROPHIES).index(k) * 17)
            im = Image.open(io.BytesIO(base64.b64decode(res["base64_images"][0])))
            pixelate(im).save(os.path.join(OUT, f"trophy-{k}.png"))
            print(f"  {k:20} (balance {res.get('remaining_balance')})")
        except Exception as e:
            print(f"  {k} error (skipped):", e)
    contact_sheet()

if __name__ == "__main__":
    main()
