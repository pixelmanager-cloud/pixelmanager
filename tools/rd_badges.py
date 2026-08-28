#!/usr/bin/env python3
"""Generate original football-club badges via the Retro Diffusion API, pixelated into the game's set.

Original AI art → zero licensing risk. Reads the API key from $RD_API_KEY or a gitignored key file
(tools/.rd_key), never from the chat/repo. Builds varied heraldic-crest prompts, requests transparent-
background pixel art, downscales to 32x32, saves badge-1..N.png, and rebuilds the manifest + numbered sheet.

Config via env:  RD_COUNT (default 60)  RD_STYLE (default rd_fast__default)  RD_SIZE (gen px, default 64)
Run:  RD_API_KEY=rdpk-... python3 tools/rd_badges.py    (or put the key in tools/.rd_key)
"""
import os, sys, json, base64, io, time, urllib.request
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "client", "public", "badges")
ENDPOINT = "https://api.retrodiffusion.ai/v1/inferences"
COUNT = int(os.environ.get("RD_COUNT", "60"))
STYLE = os.environ.get("RD_STYLE", "rd_fast__default")
GEN = int(os.environ.get("RD_SIZE", "64"))
FINAL = 32

def api_key():
    k = os.environ.get("RD_API_KEY")
    if k: return k.strip()
    for p in (os.path.join(ROOT, "tools", ".rd_key"), os.path.expanduser("~/.rd_key")):
        if os.path.exists(p):
            with open(p) as f: return f.read().strip()
    sys.exit("No API key. Set RD_API_KEY or put it in tools/.rd_key")

MOTIFS = ["golden lion", "eagle with spread wings", "wolf head", "charging bull", "stag head with antlers",
    "griffin", "phoenix", "falcon", "bear", "rearing horse", "ram head", "wild boar", "hawk", "cobra",
    "anchor", "castle tower", "crossed swords", "sailing ship", "oak tree", "war hammer", "five-point star",
    "royal crown", "lighthouse", "fox", "flaming torch", "trident", "shield with three stripes", "soccer ball",
    "knight helmet", "rose", "sword and shield", "fortress gate", "compass rose", "thunderbolt", "owl",
    "dragon head", "hammer and pick", "wheat sheaf", "mountain peak", "lion rampant"]
COLORS = ["navy blue and gold", "crimson red and white", "forest green and cream", "royal blue and silver",
    "maroon and gold", "black and white", "burgundy and grey", "sky blue and navy", "deep purple and gold",
    "orange and black"]
SHAPES = ["shield", "round badge", "crest"]

def prompt_for(i):
    m = MOTIFS[i % len(MOTIFS)]; c = COLORS[(i // 3) % len(COLORS)]; s = SHAPES[i % len(SHAPES)]
    # RD does the pixel-art part from prompt_style — describe only the subject
    return f"a football club {s} emblem, a {m}, {c}, bold clean centered symmetrical, thick dark outline, flat colors"

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
            if res.get("base64_images"):
                return res
            last = res.get("error", res)
        except Exception as e:
            last = e
        time.sleep(2 + attempt * 2)   # back off on rate-limits / hiccups, then retry
    raise RuntimeError(f"failed after {retries} attempts: {last}")

def pixelate(im):
    im = im.convert("RGBA")
    bbox = im.getbbox()
    if bbox: im = im.crop(bbox)
    w, h = im.size; s = max(w, h)
    sq = Image.new("RGBA", (s, s), (0, 0, 0, 0)); sq.paste(im, ((s-w)//2, (s-h)//2))
    small = sq.resize((FINAL, FINAL), Image.LANCZOS)
    rgb = small.convert("RGB").quantize(colors=16, method=Image.FASTOCTREE).convert("RGB")
    a = small.getchannel("A").point(lambda v: 255 if v > 110 else 0)
    return Image.merge("RGBA", (*rgb.split(), a))

def main():
    key = api_key()
    os.makedirs(OUT, exist_ok=True)
    made = 0
    for i in range(COUNT):
        p = prompt_for(i)
        try:
            res = request(key, p, 1000 + i)
            b64 = res.get("base64_images", [None])[0]
            if not b64: print("no image for", p, res.get("error")); continue
            im = Image.open(io.BytesIO(base64.b64decode(b64)))
            made += 1
            pixelate(im).save(os.path.join(OUT, f"badge-{made}.png"))
            rem = res.get("remaining_balance")
            print(f"  [{made}/{COUNT}] {p[:48]}…  (balance {rem})")
        except Exception as e:
            print("  error:", e); time.sleep(1)
    print(f"generated {made} badges → {OUT}")
    # rebuild manifest + numbered sheet via the existing tool
    os.system(f'cd "{ROOT}" && python3 tools/reindex_badges.py')

if __name__ == "__main__":
    main()
