#!/usr/bin/env python3
"""Steam capsule pieces in their NATIVE aspect ratios (RD Pro). Key from $RD_API_KEY or gitignored
tools/.rd_key; never printed.

Steam's assets are wildly different shapes and cropping a 1.75:1 image into a 3.1:1 library hero throws
away most of the art. RD Pro accepts non-square up to 256px, so each shape is generated at its own ratio
and integer-upscaled later. --check prices a batch for free and generates nothing."""
import os, sys, json, base64, time, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.environ.get("RD_OUT", "/tmp/gr/capsule3")
ENDPOINT = "https://api.retrodiffusion.ai/v1/inferences"
LOOK = "moody floodlit night stadium, deep blue and teal shadows, warm amber rim light, muted palette, cinematic, detailed pixel art, no text, no watermark, no logos"

ERA_OLD = "1950s dark stained wood panelling and a bare hanging bulb"
ERA_MID = "1980s painted breeze-block and fluorescent strip light"
ERA_NEW = "present-day brushed metal lockers and cool white LED light"
TRIPTYCH = (f"a triptych of three football shirts all numbered 12 hanging in three eras side by side, "
            f"left {ERA_OLD}, middle {ERA_MID}, right {ERA_NEW}, the same club colour in all three")

# (name, style, W, H, prompt) — W/H chosen to match the Steam asset's own ratio
PIECES = [
    # header capsule 460x215 and small capsule 462x174 are ~2.1-2.65:1
    ("header-triptych-a", "rd_pro__default", 256, 120, TRIPTYCH),
    ("header-triptych-b", "rd_pro__default", 256, 120, TRIPTYCH + ", wider framing, more room above the shirts"),
    # library capsule 600x900 is portrait 0.667:1 — the crest holds up where a scene would mush
    ("library-crest-a", "rd_pro__default", 170, 256, "an ornate heraldic football club crest, gold on deep blue, three small family figures worked into the shield, tall vertical composition, floodlit stadium faint behind"),
    ("library-crest-b", "rd_pro__painterly", 170, 256, "a tall vertical football club crest in gold and deep blue, a father and son motif inside the shield, ornate scrollwork, dark stadium night behind"),
    # library hero 3840x1240 is ultra-wide 3.1:1 — silhouettes survive that crop, detail does not
    ("hero-tunnel-a", "rd_pro__default", 256, 83, "silhouettes of three footballers of different ages walking out of a stadium tunnel into blinding floodlight, ultra wide panoramic composition"),
    ("hero-tunnel-b", "rd_pro__default", 256, 83, "an ultra wide panorama of a floodlit night stadium, three small figures of different ages walking onto the pitch together, vast empty stands"),
]

def api_key():
    k = os.environ.get("RD_API_KEY")
    if k: return k.strip()
    for p in (os.path.join(ROOT, "tools", ".rd_key"), os.path.expanduser("~/.rd_key")):
        if os.path.exists(p):
            with open(p) as f: return f.read().strip()
    sys.exit("No API key. Set RD_API_KEY or put it in tools/.rd_key")

def call(key, style, w, h, prompt, seed, check=False, retries=3):
    body = {"prompt": f"{prompt}, {LOOK}", "prompt_style": style, "width": w, "height": h,
            "num_images": 1, "seed": seed}
    if check: body["check_cost"] = True
    data = json.dumps(body).encode()
    last = None
    for a in range(retries):
        try:
            req = urllib.request.Request(ENDPOINT, data=data, method="POST",
                                         headers={"X-RD-Token": key, "Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=240) as r:
                return json.loads(r.read())
        except Exception as e:
            last = str(e)[:120]; time.sleep(2 + a * 3)
    return {"error": last}

def main():
    check = "--check" in sys.argv
    key = api_key(); os.makedirs(OUT, exist_ok=True)
    total = 0.0; res = {}
    for i, (name, style, w, h, prompt) in enumerate(PIECES):
        res = call(key, style, w, h, prompt, seed=8100 + i * 17, check=check)
        if res.get("error"):
            print(f"  {name:<20} ERROR {res['error']}"); continue
        total += float(res.get("balance_cost") or 0)
        if check:
            print(f"  {name:<20} {w}x{h}  ${res.get('balance_cost')}"); continue
        imgs = res.get("base64_images") or []
        if not imgs:
            print(f"  {name:<20} no image: {str(res)[:70]}"); continue
        path = os.path.join(OUT, f"{name}.png")
        with open(path, "wb") as f: f.write(base64.b64decode(imgs[0]))
        print(f"  {name:<20} {w}x{h} -> {path}")
    print(f"\n  {'estimated' if check else 'spent'}: ${total:.2f}   remaining: ${res.get('remaining_balance', 0):.2f}")

main()
