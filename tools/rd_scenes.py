#!/usr/bin/env python3
"""Generate pixel-art scene backdrops via the Retro Diffusion API (RD Plus environment style). Opaque
128px scenes that sit behind the text views. Key from $RD_API_KEY or gitignored tools/.rd_key. Writes
scene-<key>.png + a labelled contact sheet.  Run:  python3 tools/rd_scenes.py  (or RD_REGEN="office,pitch")
"""
import os, sys, json, base64, io, time, urllib.request
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "client", "public", "scenes")
ENDPOINT = "https://api.retrodiffusion.ai/v1/inferences"
STYLE = os.environ.get("RD_STYLE", "rd_plus__environment")
GEN = int(os.environ.get("RD_SIZE", "128"))
FINAL = 128

SCENES = {
    "stadium": "a packed football stadium interior at night with bright floodlights and crowd",
    "pitch": "a green football pitch seen from the stands, empty, daytime",
    "dressingroom": "a football team dressing room with jerseys hanging on hooks and benches",
    "academy": "a youth football academy training ground with goals and cones, morning",
    "office": "a football manager wooden office with a desk, tactics board and a window",
    "trophyroom": "a trophy cabinet room with shelves of gleaming golden trophies, warm light",
    "pressroom": "a football press conference room with a backdrop board and microphones",
    "scouting": "an old world map on a wall with pins and a desk lamp, scouting room",
}

def prompt_for(desc):
    return f"pixel art scene, {desc}, atmospheric, muted colours, detailed background, no text, no people faces"

def api_key():
    k = os.environ.get("RD_API_KEY")
    if k: return k.strip()
    for p in (os.path.join(ROOT, "tools", ".rd_key"), os.path.expanduser("~/.rd_key")):
        if os.path.exists(p):
            with open(p) as f: return f.read().strip()
    sys.exit("No API key. Set RD_API_KEY or put it in tools/.rd_key")

def request(key, prompt, seed, retries=4):
    body = json.dumps({"prompt": prompt, "prompt_style": STYLE, "width": GEN, "height": GEN,
                       "num_images": 1, "seed": seed, "remove_bg": False}).encode()
    last = None
    for a in range(retries):
        try:
            req = urllib.request.Request(ENDPOINT, data=body, method="POST",
                                         headers={"X-RD-Token": key, "Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=180) as r:
                res = json.loads(r.read())
            if res.get("base64_images"): return res
            last = res.get("error", res)
        except Exception as e:
            last = e
        time.sleep(2 + a * 2)
    raise RuntimeError(f"failed: {last}")

def finish(im):
    return im.convert("RGB").resize((FINAL, FINAL), Image.LANCZOS).quantize(colors=48, method=Image.FASTOCTREE).convert("RGB")

def contact_sheet():
    keys = [k for k in SCENES if os.path.exists(os.path.join(OUT, f"scene-{k}.png"))]
    cols, cell, pad, lbl = 4, 120, 8, 12
    rows = (len(keys) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * (cell + pad) + pad, rows * (cell + lbl + pad) + pad), (24, 24, 28))
    d = ImageDraw.Draw(sheet)
    try: font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 10)
    except Exception: font = ImageFont.load_default()
    for k, key in enumerate(keys):
        r, cc = divmod(k, cols); x = pad + cc * (cell + pad); y = pad + r * (cell + lbl + pad)
        sheet.paste(Image.open(os.path.join(OUT, f"scene-{key}.png")).convert("RGB").resize((cell, cell), Image.NEAREST), (x, y))
        d.text((x, y + cell + 1), key, fill=(210, 210, 215), font=font)
    sheet.save("/tmp/scenes_sheet.png")
    print(f"contact sheet -> /tmp/scenes_sheet.png ({len(keys)})")

def main():
    key = api_key()
    os.makedirs(OUT, exist_ok=True)
    regen = os.environ.get("RD_REGEN", "").strip()
    todo = [k for k in regen.replace(" ", "").split(",") if k] if regen else list(SCENES.keys())
    print(f"generating {len(todo)} scene(s) via {STYLE}")
    for k in todo:
        if k not in SCENES: print(f"  ?? unknown '{k}'"); continue
        try:
            res = request(key, prompt_for(SCENES[k]), 9700 + list(SCENES).index(k) * 19)
            im = Image.open(io.BytesIO(base64.b64decode(res["base64_images"][0])))
            finish(im).save(os.path.join(OUT, f"scene-{k}.png"))
            print(f"  {k:14} (balance {res.get('remaining_balance')})")
        except Exception as e:
            print(f"  {k} error (skipped):", e)
    contact_sheet()

if __name__ == "__main__":
    main()
