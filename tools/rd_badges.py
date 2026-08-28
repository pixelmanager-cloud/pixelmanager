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

# Fresh distinct subjects (none overlap the 40 base MOTIFS) — used to give every badge in the set its
# own motif so no two crests share a family. Plenty of headroom (>80 needed for full de-duplication).
EXTRA_MOTIFS = ["panther head", "leopard head", "tiger head", "lynx head", "bison head", "rhinoceros head",
    "buffalo skull", "raven", "osprey", "kestrel", "swan", "heron", "crane bird", "rooster", "magpie",
    "kingfisher", "pelican", "coiled viper", "python", "scorpion", "spider", "hornet", "bee", "dragonfly",
    "crab", "lobster", "seahorse", "leaping dolphin", "shark", "whale tail", "octopus", "sea serpent",
    "stag beetle", "salamander", "unicorn head", "pegasus", "hydra", "kraken", "minotaur", "centaur",
    "wyvern", "basilisk", "chimera", "sphinx", "gargoyle", "thunderbird", "iron gauntlet", "battle axe",
    "crossed arrows", "crossed keys", "crossed spears", "halberd", "spiked mace", "longbow and arrow",
    "flaming sword", "upright broadsword", "kite shield", "spartan helmet", "viking helmet", "crested war helm",
    "heater shield", "portcullis", "watchtower", "windmill", "water wheel", "forge anvil", "blacksmith tongs",
    "miner lantern", "crossed pickaxes", "ship wheel", "life ring buoy", "harpoon", "fishing net", "pine tree",
    "great redwood", "laurel wreath", "olive branch", "acorn", "thistle", "clover leaf", "tulip", "sunflower",
    "maple leaf", "crossed torches", "rising sun", "crescent moon", "shooting star", "volcano", "waterfall",
    "cresting wave"]

def prompt_from(m, c, s):
    return f"a football club {s} emblem, a {m}, {c}, bold clean centered symmetrical, thick dark outline, flat colors"

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
    import glob
    if os.environ.get("RD_UNIQUE"):  # de-duplicate motifs: give every badge its own distinct family
        total = len(glob.glob(os.path.join(OUT, "badge-*.png")))
        # reconstruct the motif each existing badge was generated with (see prompt_for / regen offsets)
        batchA = ["3","6","15","40","43","50","58","65","81","83","93","94","105","108","115"]
        batchB = ["15","39","64","105"]
        def cur_off(n):
            if str(n) in batchB: return 300 + n*3 + batchB.index(str(n))
            if str(n) in batchA: return 300 + n*3 + batchA.index(str(n))
            return (n-1) + 200
        keep, regen_ns, seen = {}, [], set()
        for n in range(1, total+1):
            m = MOTIFS[cur_off(n) % len(MOTIFS)]
            if m in seen: regen_ns.append(n)      # a later copy of an already-kept motif -> reassign
            else: seen.add(m); keep[n] = m         # first sighting of this motif -> keep the art as-is
        print(f"{total} badges: keeping {len(keep)} (one per motif), regenerating {len(regen_ns)} with fresh unique motifs")
        for k, n in enumerate(regen_ns):
            m = EXTRA_MOTIFS[k % len(EXTRA_MOTIFS)]
            c = COLORS[(k*7 + 3) % len(COLORS)]; s = SHAPES[(k*2 + 1) % len(SHAPES)]
            seed = 7000 + n*31 + k             # unique per badge so no two seeds collide
            try:
                res = request(key, prompt_from(m, c, s), seed)
                im = Image.open(io.BytesIO(base64.b64decode(res["base64_images"][0])))
                pixelate(im).save(os.path.join(OUT, f"badge-{n}.png"))
                print(f"  badge-{n}: {m} / {c} / {s}  (balance {res.get('remaining_balance')})")
            except Exception as e:
                print(f"  badge-{n} error (kept old):", e)
        os.system(f'cd "{ROOT}" && python3 tools/reindex_badges.py')
        return
    regen = os.environ.get("RD_REGEN", "").strip()
    if regen:  # regenerate specific badge numbers in place with fresh art
        nums = [int(x) for x in regen.replace(" ", "").split(",") if x]
        print(f"regenerating {len(nums)} badges: {nums}")
        for j, n in enumerate(nums):
            off = 300 + n * 3 + j   # fresh motif/colour combo, distinct from the existing set
            try:
                res = request(key, prompt_for(off), 3000 + off)
                im = Image.open(io.BytesIO(base64.b64decode(res["base64_images"][0])))
                pixelate(im).save(os.path.join(OUT, f"badge-{n}.png"))
                print(f"  badge-{n}: {prompt_for(off)[:44]}…  (balance {res.get('remaining_balance')})")
            except Exception as e:
                print(f"  badge-{n} error (kept old):", e)
        os.system(f'cd "{os.path.dirname(os.path.dirname(os.path.abspath(__file__)))}" && python3 tools/reindex_badges.py')
        return
    existing = len(glob.glob(os.path.join(OUT, "badge-*.png")))  # APPEND: keep what's there, fill up to COUNT
    made = existing
    print(f"{existing} existing badges; topping up to {COUNT}")
    for k in range(existing, COUNT):
        off = k + 200   # offset so top-up badges use fresh motif/colour combos, never the ones already made
        p = prompt_for(off)
        try:
            res = request(key, p, 1000 + off)
            b64 = res["base64_images"][0]
            im = Image.open(io.BytesIO(base64.b64decode(b64)))
            made += 1
            pixelate(im).save(os.path.join(OUT, f"badge-{made}.png"))
            print(f"  [{made}/{COUNT}] {p[:48]}…  (balance {res.get('remaining_balance')})")
        except Exception as e:
            print("  error (skipped):", e)
    print(f"now {made} badges → {OUT}")
    # rebuild manifest + numbered sheet via the existing tool
    os.system(f'cd "{ROOT}" && python3 tools/reindex_badges.py')

if __name__ == "__main__":
    main()
