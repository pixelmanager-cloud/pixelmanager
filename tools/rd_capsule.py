#!/usr/bin/env python3
"""Steam capsule key-art candidates via the Retro Diffusion API (RD Pro — the highest tier).

Key from $RD_API_KEY or gitignored tools/.rd_key; never printed. RD Pro caps at 256px, so these are
generated at native pixel-art resolution in the MAIN CAPSULE's aspect ratio (1232x706 ~ 1.745:1) and
integer-upscaled later — the only way to enlarge pixel art without blurring it.

Concept: THE BLOODLINE. Three generations of one family, which is the thing that makes this game
different from every other football manager. Run with --check to price a batch without generating.
"""
import os, sys, json, base64, time, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.environ.get("RD_OUT", "/tmp/gr/capsule")
ENDPOINT = "https://api.retrodiffusion.ai/v1/inferences"
W, H = 256, 146          # ~1.745:1, the main capsule's ratio; RD Pro's ceiling is 256

# House style, carried from the in-game scenes: floodlit night, deep blues, warm highlights.
LOOK = "moody floodlit night stadium, deep blue and teal shadows, warm amber rim light, muted palette, cinematic, detailed pixel art, no text, no watermark, no logos"

# Batch 2 — production. CK's note on the shirt triptych: each shirt should sit in ITS OWN ERA, so the
# surroundings age with the generation rather than three shirts in one room. Era is carried by the
# ROOM, the LIGHT and the FABRIC, with the same squad number on all three as the through-line.
ERA_OLD = "a 1950s football dressing room, dark stained wood panelling, brass hooks, one bare hanging bulb, sepia and amber light, heavy cotton shirt with a laced collar"
ERA_MID = "a 1980s football dressing room, painted breeze-block wall, humming fluorescent strip light, chipped bench, shiny nylon shirt, cooler green-grey light"
ERA_NEW = "a present-day football dressing room, brushed metal lockers, cool white LED strip lighting, technical fabric shirt, clean blue-white light"

CANDIDATES = [
    # --- the hero, as a single triptych: three eras side by side in one frame ---
    ("hooks2-triptych-a", "rd_pro__default",
     f"a triptych of three football shirts all numbered 12 hanging in three different eras side by side, left panel {ERA_OLD}, middle panel {ERA_MID}, right panel {ERA_NEW}, one family's number across three generations"),
    ("hooks2-triptych-b", "rd_pro__default",
     f"three vertical panels showing the same number 12 football shirt in three eras, from left to right the room ages forward in time: {ERA_OLD}, then {ERA_MID}, then {ERA_NEW}"),
    ("hooks2-triptych-c", "rd_pro__painterly",
     f"three football shirts numbered 12 on hooks, each in a room from a different decade, oldest on the left and newest on the right, {ERA_OLD} beside {ERA_MID} beside {ERA_NEW}"),
    ("hooks2-triptych-d", "rd_pro__default",
     f"a wall divided into three eras of football dressing room, each with one hanging shirt numbered 12, left {ERA_OLD}, centre {ERA_MID}, right {ERA_NEW}, generational"),
    # --- and as three separate panels, for a composed triptych with full control per era ---
    ("hooks2-panel-old", "rd_pro__default", f"a single football shirt numbered 12 hanging on a brass hook in {ERA_OLD}, worn and faded, centred"),
    ("hooks2-panel-mid", "rd_pro__default", f"a single football shirt numbered 12 hanging on a hook in {ERA_MID}, well used, centred"),
    ("hooks2-panel-new", "rd_pro__default", f"a single football shirt numbered 12 hanging in {ERA_NEW}, crisp and new, centred"),
]

# Portrait pieces for the library capsule (600x900) and the ultra-wide library hero (3840x1240) are
# generated in their own aspect ratios by tools/rd_capsule_shapes.py.


def api_key():
    k = os.environ.get("RD_API_KEY")
    if k: return k.strip()
    for p in (os.path.join(ROOT, "tools", ".rd_key"), os.path.expanduser("~/.rd_key")):
        if os.path.exists(p):
            with open(p) as f: return f.read().strip()
    sys.exit("No API key. Set RD_API_KEY or put it in tools/.rd_key")

def call(key, style, prompt, seed, check=False, retries=3):
    body = {"prompt": f"{prompt}, {LOOK}", "prompt_style": style, "width": W, "height": H,
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
    key = api_key()
    os.makedirs(OUT, exist_ok=True)
    total = 0.0
    for i, (name, style, prompt) in enumerate(CANDIDATES):
        res = call(key, style, prompt, seed=7000 + i * 13, check=check)
        if res.get("error"):
            print(f"  {name:<14} ERROR {res['error']}"); continue
        total += float(res.get("balance_cost") or 0)
        if check:
            print(f"  {name:<14} {style:<20} ${res.get('balance_cost')}")
            continue
        imgs = res.get("base64_images") or []
        if not imgs:
            print(f"  {name:<14} no image returned: {str(res)[:80]}"); continue
        path = os.path.join(OUT, f"cap-{name}.png")
        with open(path, "wb") as f: f.write(base64.b64decode(imgs[0]))
        print(f"  {name:<14} {style:<20} -> {path}")
    print(f"\n  {'estimated' if check else 'spent'}: ${total:.2f}   remaining balance: ${res.get('remaining_balance', 0):.2f}")

main()
