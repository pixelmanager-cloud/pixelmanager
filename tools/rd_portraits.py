#!/usr/bin/env python3
"""Expand the player-portrait library via the Retro Diffusion API.

Key from $RD_API_KEY or gitignored tools/.rd_key; never printed. Dry run by default (--check prices a
batch without generating); pass --go to actually spend.

WHY: portraits are hash-assigned from three age-banded pools that hold 20 / 24 / 20 images. On a card you
see one face at a time, so a repeat is invisible — but the Family Record shows the whole dynasty at once,
and the birthday maths is unkind. With 20 in a band, a twelve-person view expects 3.3 pairs of identical
faces and a sixteen-person one expects 6. At 250 a band those fall to 0.26 and 0.48.

VARIETY IS THE POINT, so the prompts are a systematic sweep rather than random rerolls: every image is a
distinct (skin, hair style, hair colour, facial hair, build) combination, walked with coprime strides so
coverage is even instead of clustered. Random sampling at this size reliably produces near-duplicates.
"""
import argparse, base64, concurrent.futures as cf, hashlib, json, os, sys, threading, time, urllib.request, zlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENDPOINT = "https://api.retrodiffusion.ai/v1/inferences"
OUT = os.path.join(ROOT, "client", "public", "portraits")
# 64, not the 48 the game currently ships: RD refuses 48x48 outright ("inference_failed"), and 64 is an
# upgrade anyway — the player card renders portraits at 84px, so the existing 48px art is already being
# scaled UP. Nothing depends on the source size; every call site sets its own width/height.
W = H = 64
STYLE = "retro"

# Held constant so a new face sits beside the existing 64 without looking imported.
LOOK = ("head and shoulders portrait of a footballer, front facing, centred, neutral expression, "
        "wearing a football shirt with a visible collar, plain dark background, detailed pixel art, "
        "no text, no watermark, no logo, no border")

# HERITAGE, not just a skin tone. Holding "olive skin" constant across three separate generations was not
# enough: skin tone alone leaves the facial features free, so the same man could come back Mediterranean at
# 17 and East Asian at 38. Each entry pairs a heritage with the tones that plausibly go with it, and BOTH
# are fixed per identity, so a person's ethnicity survives ageing.
HERITAGE = [
    # (heritage, plausible skin tones, plausible natural hair colours)
    # Hair STYLE is left free — a crop or dreadlocks is a choice anyone can make — but colour is not, and
    # an auburn-haired Polynesian is the kind of detail that makes a face look generated.
    ("Northern European", ["very fair", "fair"],          ["jet black", "dark brown", "chestnut brown", "light brown", "blond", "sandy blond", "ginger red", "auburn"]),
    ("Eastern European",  ["fair", "light olive"],        ["jet black", "dark brown", "chestnut brown", "light brown", "blond"]),
    ("Mediterranean",     ["light olive", "olive"],       ["jet black", "dark brown", "chestnut brown"]),
    ("Middle Eastern",    ["olive", "tan"],               ["jet black", "dark brown"]),
    ("North African",     ["olive", "tan"],               ["jet black", "dark brown"]),
    ("West African",      ["dark brown", "very dark"],    ["jet black", "dark brown"]),
    ("East African",      ["brown", "dark brown"],        ["jet black", "dark brown"]),
    ("Afro-Caribbean",    ["brown", "dark brown"],        ["jet black", "dark brown"]),
    ("South Asian",       ["tan", "brown"],               ["jet black", "dark brown"]),
    ("East Asian",        ["fair", "light olive"],        ["jet black", "dark brown"]),
    ("South East Asian",  ["light olive", "tan"],         ["jet black", "dark brown"]),
    ("Latin American",    ["light olive", "tan"],         ["jet black", "dark brown", "chestnut brown"]),
    ("Brazilian",         ["olive", "brown"],             ["jet black", "dark brown", "chestnut brown"]),
    ("Polynesian",        ["tan", "brown"],               ["jet black", "dark brown"]),
]
# (article, noun) rather than a single string: gluing a colour in front of "a buzz cut" produced
# "jet black a buzz cut", and "ash grey a receding hairline". An article has to sit before the colour, and
# plurals ("dreadlocks", "tight curls") take none at all. A colourless entry means the colour is skipped —
# "a jet black shaved head" is not a thing.
HAIR  = [("a", "buzz cut", True), ("a", "short crop", True), ("a", "neat side part", True),
         ("", "tight curls", True), ("an", "afro", True), ("", "shoulder-length hair", True),
         ("a", "ponytail", True), ("", "dreadlocks", True), ("a", "mohawk", True),
         ("a", "shaved head", False), ("a", "receding hairline", True), ("a", "man bun", True),
         ("a", "messy fringe", True), ("", "slicked-back hair", True), ("a", "flat top", True),
         ("", "wavy hair", True)]
# NATURAL colours only. Grey and white belong to age, not to a person's identity — leaving them in the
# base palette handed a seventeen-year-old academy player silver hair.
COLOUR = ["jet black", "dark brown", "chestnut brown", "light brown", "blond", "ginger red", "sandy blond", "auburn"]
FACE  = {
    "youth":   ["clean shaven", "clean shaven", "the faintest stubble"],
    "prime":   ["clean shaven", "light stubble", "a trimmed beard", "a moustache", "a goatee", "a full beard"],
    "veteran": ["clean shaven", "a grey beard", "a white moustache", "a short grey beard", "weathered and clean shaven"],
}
AGE = {
    "youth":   "a teenage academy player, about 17, smooth young face",
    "prime":   "a professional footballer in his late twenties",
    "veteran": "a veteran in his late thirties, lined face, greying",
}
# Veterans read grey/white regardless of what they once were.
COLOUR_FOR = {"veteran": ["ash grey", "silver white", "steel grey", "salt and pepper", "thinning grey"]}

def api_key():
    k = os.environ.get("RD_API_KEY")
    if k: return k.strip()
    for p in (os.path.join(ROOT, "tools", ".rd_key"), os.path.expanduser("~/.rd_key")):
        if os.path.exists(p):
            with open(p) as f: return f.read().strip()
    sys.exit("No API key. Set RD_API_KEY or put it in tools/.rd_key")

def identity(i):
    """The fixed features of one person, independent of age. Coprime strides so each axis advances at a
    different rate and combinations do not repeat until the space is exhausted — random sampling at this
    size reliably produces near-duplicates."""
    art, noun, takes_colour = HAIR[(i * 5) % len(HAIR)]
    her, tones, cols = HERITAGE[(i * 3) % len(HERITAGE)]
    return {"heritage": her, "skin": tones[(i // len(HERITAGE)) % len(tones)],
            "art": art, "noun": noun, "colour_ok": takes_colour,
            "colour": cols[(i * 7) % len(cols)], "face": (i * 11) % 6}

def plan(band, n, start):
    """One person, aged into a band. THE SAME IDENTITY INDEX PRODUCES THE SAME MAN IN ALL THREE BANDS —
    same skin, same hair style, the colour greying with age — because the game picks a person by name and
    then a band by age. Generating three independent pools instead is what makes a squad player turn into
    a different human being on his twentieth birthday."""
    faces = FACE[band]
    out = []
    for i in range(n):
        idn = identity(start + i)
        skin, art, noun, takes_colour = idn["skin"], idn["art"], idn["noun"], idn["colour_ok"]
        her = idn["heritage"]
        # His hair greys as he ages; it does not become somebody else's hair.
        col = "greying " + idn["colour"] if band == "veteran" else idn["colour"]
        fac = faces[idn["face"] % len(faces)]
        words = [x for x in (col if takes_colour else "", noun) if x]
        # The article agrees with whatever word ACTUALLY follows it, which is the colour when there is one —
        # "a ash grey receding hairline" otherwise, because the article was chosen against the noun.
        if art: art = "an" if words and words[0][0].lower() in "aeiou" else "a"
        hair = " ".join(([art] if art else []) + words)
        out.append((start + i,
                    f"{AGE[band]}, {her} man, {skin} skin, {hair}, {fac}, {LOOK}"))
    return out

def call(key, prompt, seed, check):
    body = {"prompt": prompt, "prompt_style": STYLE, "width": W, "height": H, "num_images": 1, "seed": seed}
    if check: body["check_cost"] = True
    req = urllib.request.Request(ENDPOINT, data=json.dumps(body).encode(), method="POST",
                                 headers={"X-RD-Token": key, "Content-Type": "application/json"})
    for a in range(3):
        try:
            with urllib.request.urlopen(req, timeout=240) as r: return json.loads(r.read())
        except Exception as e:
            last = str(e)[:160]; time.sleep(2 + a * 3)
    return {"error": last}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--go", action="store_true", help="actually generate (default is a costed dry run)")
    ap.add_argument("--youth", type=int, default=0)
    ap.add_argument("--prime", type=int, default=0)
    ap.add_argument("--veteran", type=int, default=0)
    # Generate somewhere else first. A pilot written straight into the live pool is immediately in the
    # game's hash rotation, so a batch you end up rejecting has already changed which face every existing
    # player gets — the assignment is `hash(name) % pool.length`.
    ap.add_argument("--out", default=None, help="write elsewhere than the live portraits folder")
    # A single request takes ~18s, so 2,400 of them serially is twelve hours. RD serves them concurrently
    # (measured: 4 at once finish in the time one takes), which turns the run into about ninety minutes.
    ap.add_argument("--workers", type=int, default=8)
    a = ap.parse_args()
    counts = {"youth": a.youth, "prime": a.prime, "veteran": a.veteran}
    if not any(counts.values()): sys.exit("nothing requested — pass --youth/--prime/--veteran counts")
    key = api_key()
    out_dir = a.out or OUT
    os.makedirs(out_dir, exist_ok=True)
    total_cost, made, skipped = 0.0, 0, 0
    lock = threading.Lock()

    jobs = []
    for band, n in counts.items():
        if not n: continue
        print(f"\n{band}: generating {n} (identity indices 0-{n-1})")
        for idx, prompt in plan(band, n, 0):
            jobs.append((band, idx, prompt))

    def one(job):
        """Generate a single portrait. Returns (written, dollars, note)."""
        band, idx, prompt = job
        dest = os.path.join(out_dir, f"portrait-{band}-{idx}.png")
        # Resumable: 2,400 images is a long run and a crash partway must not re-spend on work already
        # paid for.
        if a.go and os.path.exists(dest) and os.path.getsize(dest) > 0:
            return (False, 0.0, "skip")
        # zlib.crc32, not Python's hash(): hash() of a string is randomised per process, so reruns produced
        # different seeds and nothing was reproducible. Keyed on the IDENTITY and shared by all three of its
        # bands — the same latent with only the age wording changed gives a far more consistent-looking man
        # than three unrelated seeds. Different identities get different seeds, which is what stops two
        # people coming out as the same face.
        seed = zlib.crc32(f"fr-portrait-{idx}".encode()) & 0x7fffffff
        res = call(key, prompt, seed=seed, check=not a.go)
        if "error" in res: return (False, 0.0, f"ERROR {res['error']}")
        cost = float(res.get("balance_cost") or 0)
        if not a.go: return (False, cost, "dry")
        b64 = (res.get("base64_images") or [None])[0]
        if not b64: return (False, cost, "no image in response")
        with open(dest, "wb") as f: f.write(base64.b64decode(b64))
        return (True, cost, "ok")

    with cf.ThreadPoolExecutor(max_workers=a.workers) as ex:
        for wrote, cost, note in ex.map(one, jobs):
            with lock:
                total_cost += cost
                if wrote: made += 1
                elif note == "skip": skipped += 1
                elif note not in ("dry",): print(f"  {note}", flush=True)
                if made and made % 50 == 0:
                    print(f"  ...{made} written, {skipped} skipped, ${total_cost:.2f} spent", flush=True)

    print(f"\n{'GENERATED' if a.go else 'DRY RUN'} — {made} written, {skipped} already present, ${total_cost:.2f} spent")
    if not a.go: print("Nothing was generated and nothing charged. Re-run with --go to spend.")

if __name__ == "__main__":
    main()
